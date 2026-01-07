import multer from "multer";
import { HttpError } from "../errors/HttpError";

// Configura subida en memoria con límite y tipos permitidos.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/tiff"
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      cb(new HttpError(415, "Unsupported image format"));
    } else {
      cb(null, true);
    }
  }
});
