import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { FilterParams, ImageRequestContext } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

const allowedFilters: FilterParams["filter"][] = ["blur", "sharpen", "grayscale"];

// Valida filtro y parámetros (sigma) y delega en ImageService.
export class FilterHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const params = ctx.params as Partial<FilterParams>;
    const filter = params.filter as FilterParams["filter"] | undefined;
    if (!filter || !allowedFilters.includes(filter)) {
      throw new HttpError(400, "Invalid or missing filter");
    }
    const sigma = params.sigma !== undefined ? Number(params.sigma) : undefined;
    if (sigma !== undefined && (!Number.isFinite(sigma) || sigma <= 0)) {
      throw new HttpError(400, "Invalid sigma value");
    }
    return this.imageService.filter(file, { filter, sigma });
  }
}
