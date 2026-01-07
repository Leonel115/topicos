import { mkdir, appendFile } from "fs/promises";
import { dirname } from "path";
import { ILogger, LogEntry } from "./ILogger";

// Logger que escribe entradas en un archivo de texto.
export class FileLogger implements ILogger {
  constructor(private readonly logPath: string) {}

  async log(entry: LogEntry): Promise<void> {
    const line = `${JSON.stringify(entry)}\n`;
    await mkdir(dirname(this.logPath), { recursive: true });
    await appendFile(this.logPath, line, { encoding: "utf8" });
  }
}
