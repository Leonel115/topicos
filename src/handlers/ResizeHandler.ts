import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { ImageRequestContext, ResizeParams } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

// Valida parámetros de resize y delega en ImageService.
export class ResizeHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const params = ctx.params as Partial<ResizeParams>;
    const width = Number(params.width);
    const height = params.height !== undefined ? Number(params.height) : undefined;
    if (!Number.isFinite(width) || width <= 0) {
      throw new HttpError(400, "Invalid or missing width");
    }
    if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
      throw new HttpError(400, "Invalid height");
    }
    const fit = params.fit as ResizeParams["fit"] | undefined;
    return this.imageService.resize(file, { width, height, fit });
  }
}
