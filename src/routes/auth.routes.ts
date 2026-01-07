import { Router } from "express";
import { AuthService } from "../services/AuthService";
import { ApiResponse } from "../types/tipos";
import { HttpError } from "../errors/HttpError";

// Router de autenticación: registro y login con respuestas tipadas.
export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        throw new HttpError(400, "Email and password are required");
      }
      const payload = await authService.register(email, password);
      const response: ApiResponse<typeof payload> = {
        success: true,
        data: payload,
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unexpected error";
      const response: ApiResponse<null> = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      };
      res.status(status).json(response);
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        throw new HttpError(400, "Email and password are required");
      }
      const token = await authService.login(email, password);
      const response: ApiResponse<{ token: string }> = {
        success: true,
        data: { token },
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 401;
      const message = error instanceof Error ? error.message : "Unexpected error";
      const response: ApiResponse<null> = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      };
      res.status(status).json(response);
    }
  });

  return router;
}
