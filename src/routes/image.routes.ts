import { Router, Request } from "express";
import sharp from "sharp";
import { AuthService } from "../services/AuthService";
import { ImageService } from "../services/ImageService";
import { ILogger } from "../logging/ILogger";
import { AuthDecorator } from "../decorators/AuthDecorator";
import { LoggingDecorator } from "../decorators/LoggingDecorator";
import { upload } from "../middleware/upload";
import { ImageRequestContext, PipelineStep, ResizeParams, CropParams, FormatParams, RotateParams, FilterParams } from "../types/tipos";
import { HttpError } from "../errors/HttpError";
import { ResizeHandler } from "../handlers/ResizeHandler";
import { CropHandler } from "../handlers/CropHandler";
import { FormatHandler } from "../handlers/FormatHandler";
import { RotateHandler } from "../handlers/RotateHandler";
import { FilterHandler } from "../handlers/FilterHandler";
import { PipelineHandler } from "../handlers/PipelineHandler";
import { IImageHandler } from "../handlers/IImageHandler";

// Extrae el token JWT del header Authorization.
function extractToken(req: Request): string | undefined {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return undefined;
  const [scheme, value] = header.split(" ");
  if (scheme !== "Bearer" || !value) return undefined;
  return value;
}

// Aplica AOP: primero autenticación, luego logging alrededor del handler.
function wrap(handler: IImageHandler, authService: AuthService, logger: ILogger): IImageHandler {
  return new LoggingDecorator(new AuthDecorator(handler, authService), logger);
}

// Valida y convierte a número, con mínimos y opcionalmente entero.
function toNumber(value: unknown, name: string, { min, integer }: { min?: number; integer?: boolean } = {}): number {
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, `Missing required parameter: ${name}`);
  }
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) {
    throw new HttpError(400, `Invalid number for ${name}`);
  }
  if (integer && !Number.isInteger(num)) {
    throw new HttpError(400, `${name} must be an integer`);
  }
  if (min !== undefined && num < min) {
    throw new HttpError(400, `${name} must be >= ${min}`);
  }
  return num;
}

const allowedFits = new Set<ResizeParams["fit"]>(["cover", "contain", "fill", "inside", "outside"]);
const allowedFormats = new Set<FormatParams["format"]>(["jpeg", "png", "webp", "avif", "tiff"]);
const allowedAngles = new Set<RotateParams["angle"]>([90, 180, 270]);
const allowedFilters = new Set<FilterParams["filter"]>(["blur", "sharpen", "grayscale"]);

const isFit = (v: unknown): v is ResizeParams["fit"] => typeof v === "string" && allowedFits.has(v as ResizeParams["fit"]);
const isFormat = (v: unknown): v is FormatParams["format"] => typeof v === "string" && allowedFormats.has(v as FormatParams["format"]);
const isFilter = (v: unknown): v is FilterParams["filter"] => typeof v === "string" && allowedFilters.has(v as FilterParams["filter"]);

// Valida parámetros de resize.
function parseResizeParams(body: Record<string, unknown>): ResizeParams {
  const width = toNumber(body.width, "width", { min: 1, integer: true });
  const heightValue = body.height;
  const fitValue = body.fit as string | undefined;
  const height = heightValue !== undefined ? toNumber(heightValue, "height", { min: 1, integer: true }) : undefined;
  if (fitValue && !isFit(fitValue)) {
    throw new HttpError(400, "Invalid fit value");
  }
  const fit = fitValue as ResizeParams["fit"] | undefined;
  return { width, height, fit };
}

// Valida parámetros de recorte.
function parseCropParams(body: Record<string, unknown>): CropParams {
  const left = toNumber(body.left, "left", { min: 0, integer: true });
  const top = toNumber(body.top, "top", { min: 0, integer: true });
  const width = toNumber(body.width, "width", { min: 1, integer: true });
  const height = toNumber(body.height, "height", { min: 1, integer: true });
  return { left, top, width, height };
}

// Valida parámetros de formato de salida.
function parseFormatParams(body: Record<string, unknown>): FormatParams {
  const format = (body.format as string | undefined)?.toLowerCase();
  if (!format || !isFormat(format)) {
    throw new HttpError(400, "Invalid format");
  }
  return { format: format as FormatParams["format"] }; 
}

// Valida parámetros de rotación.
function parseRotateParams(body: Record<string, unknown>): RotateParams {
  const angle = toNumber(body.angle, "angle", { integer: true });
  if (!allowedAngles.has(angle as RotateParams["angle"])) {
    throw new HttpError(400, "Angle must be one of 90, 180, 270");
  }
  return { angle: angle as RotateParams["angle"] };
}

// Valida parámetros de filtro.
function parseFilterParams(body: Record<string, unknown>): FilterParams {
  const filter = (body.filter as string | undefined)?.toLowerCase();
  if (!filter || !isFilter(filter)) {
    throw new HttpError(400, "Invalid filter");
  }
  const sigmaValue = body.sigma;
  const sigma = sigmaValue !== undefined && sigmaValue !== "" ? toNumber(sigmaValue, "sigma", { min: 0 }) : undefined;
  return { filter: filter as FilterParams["filter"], sigma };
}

function parseMaybeJsonArray(value: unknown): unknown[] {
  // Acepta JSON en string o un array directo.
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error();
      }
      return parsed;
    } catch {
      throw new HttpError(400, "Invalid JSON for operations");
    }
  }
  if (Array.isArray(value)) return value;
  throw new HttpError(400, "Operations must be an array");
}

function parsePipelineSteps(raw: unknown): PipelineStep[] {
  // Convierte la entrada a pasos tipados y valida cada operación.
  const steps = parseMaybeJsonArray(raw);
  if (steps.length === 0) {
    throw new HttpError(400, "Pipeline requires a non-empty operations array");
  }
  return steps.map((step) => {
    if (!step || typeof step !== "object") {
      throw new HttpError(400, "Each operation must be an object");
    }
    const { type, params } = step as { type?: string; params?: Record<string, unknown> };
    switch (type) {
      case "resize":
        return { type: "resize", params: parseResizeParams(params || {}) } as PipelineStep;
      case "crop":
        return { type: "crop", params: parseCropParams(params || {}) } as PipelineStep;
      case "format":
        return { type: "format", params: parseFormatParams(params || {}) } as PipelineStep;
      case "rotate":
        return { type: "rotate", params: parseRotateParams(params || {}) } as PipelineStep;
      case "filter":
        return { type: "filter", params: parseFilterParams(params || {}) } as PipelineStep;
      default:
        throw new HttpError(400, "Unknown operation type in pipeline");
    }
  });
}

async function sendImageResponse(res: any, buffer: Buffer, filename = "processed-image") {
  // Deduce el formato de salida y setea headers para descarga.
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format || "png";
  res.setHeader("Content-Type", `image/${format}`);
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}.${format}\"`);
  res.send(buffer);
}

export function createImageRouter(imageService: ImageService, authService: AuthService, logger: ILogger): Router {
  // Router principal de imágenes: endpoints para operaciones y pipeline.
  const router = Router();

  const resizeHandler = wrap(new ResizeHandler(imageService), authService, logger);
  const cropHandler = wrap(new CropHandler(imageService), authService, logger);
  const formatHandler = wrap(new FormatHandler(imageService), authService, logger);
  const rotateHandler = wrap(new RotateHandler(imageService), authService, logger);
  const filterHandler = wrap(new FilterHandler(imageService), authService, logger);
  const pipelineHandler = wrap(new PipelineHandler(imageService), authService, logger);

  router.post("/resize", upload.single("image"), async (req, res) => {
    await handleRequest(resizeHandler, req, res, "/images/resize", parseResizeParams(req.body));
  });

  router.post("/crop", upload.single("image"), async (req, res) => {
    await handleRequest(cropHandler, req, res, "/images/crop", parseCropParams(req.body));
  });

  router.post("/format", upload.single("image"), async (req, res) => {
    await handleRequest(formatHandler, req, res, "/images/format", parseFormatParams(req.body));
  });

  router.post("/rotate", upload.single("image"), async (req, res) => {
    await handleRequest(rotateHandler, req, res, "/images/rotate", parseRotateParams(req.body));
  });

  router.post("/filter", upload.single("image"), async (req, res) => {
    await handleRequest(filterHandler, req, res, "/images/filter", parseFilterParams(req.body));
  });

  router.post("/pipeline", upload.single("image"), async (req, res) => {
    const steps = parsePipelineSteps(req.body.operations ?? req.body.steps);
    await handleRequest(pipelineHandler, req, res, "/images/pipeline", { operations: steps });
  });

  async function handleRequest(handler: IImageHandler, req: Request, res: any, endpoint: string, params: unknown) {
    // Flujo común: valida archivo, construye contexto y maneja errores.
    try {
      if (!req.file?.buffer) {
        throw new HttpError(400, "Image file is required");
      }
      const ctx: ImageRequestContext = {
        token: extractToken(req),
        endpoint,
        params: params as Record<string, unknown>,
        user: undefined
      };
      const result = await handler.handle(ctx, req.file.buffer);
      await sendImageResponse(res, result);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unexpected error";
      res.status(status).json({
        error: message,
        code: status === 401 ? "UNAUTHORIZED" : "PROCESSING_ERROR",
        timestamp: new Date().toISOString()
      });
    }
  }

  return router;
}
