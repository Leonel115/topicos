import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { SignOptions } from "jsonwebtoken";
import { connectDatabase } from "./config/database";
import { UserModel } from "./models/User";
import { AuthService } from "./services/AuthService";
import { ImageService } from "./services/ImageService";
import { FileLogger } from "./logging/FileLogger";
import { MongoLogger } from "./logging/MongoLogger";
import { CompositeLogger } from "./logging/CompositeLogger";
import { ILogger } from "./logging/ILogger";
import { createAuthRouter } from "./routes/auth.routes";
import { createImageRouter } from "./routes/image.routes";

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const LOG_PATH = process.env.LOG_PATH || "logs/app.log";
const MONGO_LOG_URI = process.env.MONGO_LOG_URI;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];

if (!MONGO_URI) {
  throw new Error("MONGO_URI is required");
}

async function bootstrap(): Promise<void> {
  // Conecta Mongo, prepara servicios, loggers y monta las rutas HTTP.
  const mongoUri = MONGO_URI as string;
  await connectDatabase(mongoUri);

  const authService = new AuthService(UserModel, JWT_SECRET, JWT_EXPIRES_IN);
  const imageService = new ImageService();

  const fileLogger = new FileLogger(LOG_PATH);
  let logger: ILogger = fileLogger;
  if (MONGO_LOG_URI) {
    const mongoLogger = new MongoLogger(MONGO_LOG_URI);
    logger = new CompositeLogger([fileLogger, mongoLogger]);
  }

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/auth", createAuthRouter(authService));
  app.use("/images", createImageRouter(imageService, authService, logger));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // Captura de errores no manejados para evitar fugas de stack.
    console.error(err);
    res.status(500).json({ error: "Internal server error", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`Image API listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
