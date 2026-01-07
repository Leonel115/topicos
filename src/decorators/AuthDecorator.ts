import { AuthService } from "../services/AuthService";
import { IImageHandler } from "../handlers/IImageHandler";
import { ImageRequestContext } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

// Decorador que exige autenticación antes de ejecutar el handler interno.
export class AuthDecorator implements IImageHandler {
  constructor(private readonly inner: IImageHandler, private readonly authService: AuthService) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const token = ctx.token;
    if (!token) {
      throw new HttpError(401, "Missing token");
    }
    try {
      const payload = this.authService.verifyToken(token);
      ctx.user = payload;
    } catch (error) {
      throw new HttpError(401, "Invalid token");
    }
    return this.inner.handle(ctx, file);
  }
}
