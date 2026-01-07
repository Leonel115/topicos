import { ImageRequestContext } from "../types/tipos";

// Contrato para handlers que reciben contexto + archivo y devuelven Buffer.
export interface IImageHandler {
  handle(ctx: ImageRequestContext, file: Buffer): Promise<Buffer>;
}
