import sharp from "sharp";
import { FilterParams, FormatParams, PipelineStep, ResizeParams, CropParams, RotateParams } from "../types/tipos";
import { OperationFactory } from "../operations/OperationFactory";
import { IImageOperation } from "../operations/IImageOperation";

// Servicio de alto nivel que orquesta operaciones de imagen.
export class ImageService {
  private readonly factory = new OperationFactory();

  async resize(buffer: Buffer, params: ResizeParams): Promise<Buffer> {
    return this.run("resize", buffer, params);
  }

  async crop(buffer: Buffer, params: CropParams): Promise<Buffer> {
    return this.run("crop", buffer, params);
  }

  async format(buffer: Buffer, params: FormatParams): Promise<Buffer> {
    return this.run("format", buffer, params);
  }

  async rotate(buffer: Buffer, params: RotateParams): Promise<Buffer> {
    return this.run("rotate", buffer, params);
  }

  async filter(buffer: Buffer, params: FilterParams): Promise<Buffer> {
    return this.run("filter", buffer, params);
  }

  async pipeline(buffer: Buffer, steps: PipelineStep[]): Promise<Buffer> {
    let current = buffer;
    for (const step of steps) {
      const op = this.factory.getOperation(step.type) as IImageOperation;
      current = await op.execute(current, step.params as never);
    }
    return current;
  }

  private async run(type: Parameters<OperationFactory["getOperation"]>[0], buffer: Buffer, params: unknown): Promise<Buffer> {
    const op = this.factory.getOperation(type);
    return op.execute(buffer, params as never);
  }

  async validateInput(buffer: Buffer): Promise<void> {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      throw new Error("Unsupported image format");
    }
  }
}
