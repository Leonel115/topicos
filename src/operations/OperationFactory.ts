import { IImageOperation } from "./IImageOperation";
import { CropOperation } from "./CropOperation";
import { ResizeOperation } from "./ResizeOperation";
import { FormatOperation } from "./FormatOperation";
import { RotateOperation } from "./RotateOperation";
import { FilterOperation } from "./FilterOperation";
import { FilterParams, FormatParams, ImageOperationType, OperationParams, ResizeParams, CropParams, RotateParams } from "../types/tipos";

export class OperationFactory {
  private readonly operations: Map<ImageOperationType, IImageOperation>;

  // Registra las operaciones disponibles y permite obtenerlas por tipo.
  constructor() {
    this.operations = new Map<ImageOperationType, IImageOperation>([
      ["resize", new ResizeOperation()],
      ["crop", new CropOperation()],
      ["format", new FormatOperation()],
      ["rotate", new RotateOperation()],
      ["filter", new FilterOperation()]
    ]);
  }

  getOperation(type: ImageOperationType): IImageOperation<OperationParams> {
    const op = this.operations.get(type);
    if (!op) {
      throw new Error(`Unknown operation: ${type}`);
    }
    return op;
  }
}

export type OperationParamMap = {
  resize: ResizeParams;
  crop: CropParams;
  format: FormatParams;
  rotate: RotateParams;
  filter: FilterParams;
};
