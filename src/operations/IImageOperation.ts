import { OperationParams } from "../types/tipos";

// Contrato genérico para operaciones de imagen basadas en buffers.
export interface IImageOperation<P extends OperationParams = OperationParams> {
  execute(buffer: Buffer, params: P): Promise<Buffer>;
}
