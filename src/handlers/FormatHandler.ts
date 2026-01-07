import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { FormatParams, ImageRequestContext } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

const allowedFormats: FormatParams["format"][] = ["jpeg", "png", "webp", "avif", "tiff"];

// Valida formato de salida y delega en ImageService.
export class FormatHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const params = ctx.params as Partial<FormatParams>;
    const format = params.format as FormatParams["format"] | undefined;
    if (!format || !allowedFormats.includes(format)) {
      throw new HttpError(400, "Invalid or missing format");
    }
    return this.imageService.format(file, { format });
  }
}
