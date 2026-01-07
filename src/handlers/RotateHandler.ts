import { ImageService } from "../services/ImageService";
import { IImageHandler } from "./IImageHandler";
import { ImageRequestContext, RotateParams } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

const allowedAngles: RotateParams["angle"][] = [90, 180, 270];

// Valida el ángulo permitido y delega en ImageService.
export class RotateHandler implements IImageHandler {
  constructor(private readonly imageService: ImageService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const params = ctx.params as Partial<RotateParams>;
    const angle = Number(params.angle) as RotateParams["angle"];
    if (!allowedAngles.includes(angle)) {
      throw new HttpError(400, "Invalid or missing angle");
    }
    return this.imageService.rotate(file, { angle });
  }
}
