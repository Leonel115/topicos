// Estructura de un registro de log.
export interface LogEntry {
  timestamp: string;
  level: "info" | "error";
  user?: string;
  endpoint: string;
  params: Record<string, unknown>;
  durationMs: number;
  result: "success" | "error";
  message?: string;
}

// Contrato para loggers que persisten entradas de log.
export interface ILogger {
  log(entry: LogEntry): Promise<void>;
}
