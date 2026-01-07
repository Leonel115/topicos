// Respuesta común para endpoints HTTP.
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Carga útil mínima del usuario autenticado.
export interface AuthPayload {
  userId: string;
  email: string;
}

// Contexto por petición de imagen, incluyendo token y parámetros.
export interface ImageRequestContext {
  token?: string;
  user?: AuthPayload;
  endpoint: string;
  params: Record<string, unknown>;
}

export type ImageOperationType =
  | "resize"
  | "crop"
  | "format"
  | "rotate"
  | "filter";

// Parámetros para redimensionar.
export interface ResizeParams {
  width: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

// Parámetros para recortar.
export interface CropParams {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Parámetros para convertir formato.
export interface FormatParams {
  format: "jpeg" | "png" | "webp" | "avif" | "tiff";
}

// Parámetros para rotar.
export interface RotateParams {
  angle: 90 | 180 | 270;
}

// Parámetros para aplicar filtro.
export interface FilterParams {
  filter: "blur" | "sharpen" | "grayscale";
  sigma?: number;
}

export type OperationParams =
  | ResizeParams
  | CropParams
  | FormatParams
  | RotateParams
  | FilterParams;

// Paso del pipeline con tipo y parámetros.
export interface PipelineStep {
  type: ImageOperationType;
  params?: OperationParams;
}
