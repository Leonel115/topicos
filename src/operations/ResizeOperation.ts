import sharp from "sharp";
import { IImageOperation } from "./IImageOperation";
import { ResizeParams } from "../types/tipos";

// Redimensiona manteniendo el modo de ajuste indicado (fit).
export class ResizeOperation implements IImageOperation<ResizeParams> {
  async execute(buffer: Buffer, params: ResizeParams): Promise<Buffer> {
    const { width, height, fit } = params;
    return sharp(buffer).resize(width, height, { fit }).toBuffer();
  }
}
