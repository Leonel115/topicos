import { ILogger, LogEntry } from "./ILogger";

// Logger compuesto que envía la entrada a múltiples loggers.
export class CompositeLogger implements ILogger {
  constructor(private readonly loggers: ILogger[]) {}

  async log(entry: LogEntry): Promise<void> {
    await Promise.all(this.loggers.map((logger) => logger.log(entry)));
  }
}
