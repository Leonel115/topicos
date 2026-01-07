import sharp from "sharp";
import { IImageOperation } from "./IImageOperation";
import { FilterParams } from "../types/tipos";

// Aplica el filtro solicitado (grayscale/blur/sharpen) usando sharp.
export class FilterOperation implements IImageOperation<FilterParams> {
  async execute(buffer: Buffer, params: FilterParams): Promise<Buffer> {
    const { filter, sigma } = params;
    let instance = sharp(buffer);
    if (filter === "grayscale") {
      instance = instance.grayscale();
    } else if (filter === "blur") {
      instance = instance.blur(typeof sigma === "number" ? sigma : undefined);
    } else if (filter === "sharpen") {
      instance = instance.sharpen();
    }
    return instance.toBuffer();
  }
}
