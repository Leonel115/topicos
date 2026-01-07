import sharp from "sharp";
import { IImageOperation } from "./IImageOperation";
import { RotateParams } from "../types/tipos";

// Rota la imagen al ángulo permitido (90/180/270 grados).
export class RotateOperation implements IImageOperation<RotateParams> {
  async execute(buffer: Buffer, params: RotateParams): Promise<Buffer> {
    const { angle } = params;
    return sharp(buffer).rotate(angle).toBuffer();
  }
}
