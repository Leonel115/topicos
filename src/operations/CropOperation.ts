import sharp from "sharp";
import { IImageOperation } from "./IImageOperation";
import { CropParams } from "../types/tipos";

// Recorta el buffer de imagen usando las coordenadas y dimensiones solicitadas.
export class CropOperation implements IImageOperation<CropParams> {
  async execute(buffer: Buffer, params: CropParams): Promise<Buffer> {
    const { left, top, width, height } = params;
    return sharp(buffer).extract({ left, top, width, height }).toBuffer();
  }
}
