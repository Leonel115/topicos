import { IImageHandler } from "../handlers/IImageHandler";
import { ILogger } from "../logging/ILogger";
import { ImageRequestContext } from "../types/tipos";

// Decorador que registra métricas y resultado del handler envuelto.
export class LoggingDecorator implements IImageHandler {
  constructor(private readonly inner: IImageHandler, private readonly logger: ILogger) {}

  async handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer> {
    const start = Date.now();
    try {
      const result = await this.inner.handle(ctx, file);
      await this.logger.log({
        timestamp: new Date().toISOString(),
        level: "info",
        user: ctx.user?.email,
        endpoint: ctx.endpoint,
        params: ctx.params,
        durationMs: Date.now() - start,
        result: "success"
      });
      return result;
    } catch (error) {
      await this.logger.log({
        timestamp: new Date().toISOString(),
        level: "error",
        user: ctx.user?.email,
        endpoint: ctx.endpoint,
        params: ctx.params,
        durationMs: Date.now() - start,
        result: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
}
