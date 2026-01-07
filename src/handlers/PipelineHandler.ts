import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { ImageRequestContext, PipelineStep } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

// Ejecuta una secuencia de pasos (pipeline) sobre la imagen.
export class PipelineHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const steps = (ctx.params.operations || ctx.params.steps) as PipelineStep[] | undefined;
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new HttpError(400, "Pipeline requires a non-empty operations array");
    }
    return this.imageService.pipeline(file, steps);
  }
}
