import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { CropParams, ImageRequestContext } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

// Valida parámetros de recorte y delega en ImageService.
export class CropHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const params = ctx.params as Partial<CropParams>;
    const left = Number(params.left);
    const top = Number(params.top);
    const width = Number(params.width);
    const height = Number(params.height);
    if (![left, top, width, height].every((n) => Number.isFinite(n))) {
      throw new HttpError(400, "Invalid crop parameters");
    }
    if (width <= 0 || height <= 0) {
      throw new HttpError(400, "Crop width/height must be positive");
    }
    return this.imageService.crop(file, { left, top, width, height });
  }
}
