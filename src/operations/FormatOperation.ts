import sharp from "sharp";
import { IImageOperation } from "./IImageOperation";
import { FormatParams } from "../types/tipos";

// Convierte el buffer a otro formato (jpeg/png/webp/avif/tiff).
export class FormatOperation implements IImageOperation<FormatParams> {
  async execute(buffer: Buffer, params: FormatParams): Promise<Buffer> {
    const { format } = params;
    return sharp(buffer).toFormat(format).toBuffer();
  }
}
