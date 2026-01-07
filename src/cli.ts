import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "readline/promises";

// URL base configurable mediante API_BASE_URL
let BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Estado de sesión en memoria para el CLI interactivo.
interface Session {
  token: string | null;
  email: string | null;
}

const session: Session = { token: null, email: null };

// Mapea extensiones de archivo a tipos MIME aceptados.
function contentTypeForExt(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === ".jpg" || lower === ".jpeg") return "image/jpeg";
  if (lower === ".png") return "image/png";
  if (lower === ".webp") return "image/webp";
  if (lower === ".tif" || lower === ".tiff") return "image/tiff";
  if (lower === ".avif") return "image/avif";
  return "application/octet-stream";
}

// Prompt async con readline/promises; devuelve la respuesta normalizada.
async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

// Quita comillas alrededor de rutas ingresadas por el usuario.
function sanitizePath(p: string): string {
  const trimmed = p.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// Menú principal con opciones según estado de autenticación.
function printMenu(): void {
  console.log("\n=== Image API CLI ===");
  console.log(`Base URL: ${BASE_URL}`);
  if (!session.token) {
    console.log("Usuario: (no autenticado)");
    console.log("1) Registrarse");
    console.log("2) Login");
    console.log("3) Salir");
  } else {
    console.log(`Usuario: ${session.email}`);
    console.log("1) Cambiar API_BASE_URL");
    console.log("2) Operaciones de imagen");
    console.log("3) Cerrar sesión");
    console.log("4) Salir");
  }
}

// Submenú de operaciones de imagen.
function printImageMenu(): void {
  console.log("\n-- Operaciones de imagen --");
  console.log("1) Resize");
  console.log("2) Crop");
  console.log("3) Rotate");
  console.log("4) Format");
  console.log("5) Filter");
  console.log("6) Pipeline");
  console.log("7) Volver");
}

// Invoca un endpoint JSON y retorna el payload (o lanza error).
async function callJson(path: string, body: Record<string, JsonValue>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = text;
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

// Flujo de registro de usuario (email/password).
async function register(): Promise<void> {
  const email = await prompt("Email: ");
  const password = await prompt("Password: ");
  if (!email || !password) {
    console.log("Email y password son requeridos.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.com$/.test(email)) {
    console.log("Email inválido. Debe contener @ y terminar en .com");
    return;
  }
  const res = await callJson("/auth/register", { email, password });
  console.log("Registrado:", res);
}

// Flujo de login; guarda el token en sesión si la respuesta es válida.
async function login(): Promise<void> {
  const email = await prompt("Email: ");
  const password = await prompt("Password: ");
  if (!email || !password) {
    console.log("Email y password son requeridos.");
    return;
  }
  const res = await callJson("/auth/login", { email, password });

  const token = extractToken(res);
  if (token) {
    session.token = token;
    session.email = email;
    console.log("Login OK. Token guardado en memoria.");
  } else {
    console.log("Respuesta inesperada:", res);
  }
}

// Construye header Authorization con el token actual.
async function authHeader(): Promise<Record<string, string>> {
  if (!session.token) {
    throw new Error("Debes hacer login primero.");
  }
  return { Authorization: `Bearer ${session.token}` };
}

// Extrae el token desde respuestas comunes de /auth/login.
function extractToken(res: unknown): string | null {
  if (res && typeof res === "object") {
    // Token directo en la respuesta
    if ("token" in res && typeof (res as { token?: unknown }).token === "string") {
      return (res as { token: string }).token;
    }
    // Forma ApiResponse { success, data: { token } }
    const maybe = res as { data?: unknown };
    if (maybe.data && typeof maybe.data === "object" && "token" in (maybe.data as { token?: unknown })) {
      const token = (maybe.data as { token?: unknown }).token;
      if (typeof token === "string") return token;
    }
  }
  return null;
}

// Envía imagen y parámetros al endpoint indicado; guarda salida.
async function sendImage(
  route: string,
  fields: Record<string, string>,
  imagePath: string,
  outputPath: string
): Promise<void> {
  const headers = await authHeader();
  const buffer = await readFile(imagePath);
  const filename = basename(imagePath);
  const mime = contentTypeForExt(extname(filename));

  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mime }), filename);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const url = `${BASE_URL}/images/${route}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const outBuffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outputPath, outBuffer);
  console.log(`Imagen guardada en ${outputPath}`);
}

// Flujo interactivo para resize.
async function resizeFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const width = await prompt("width (obligatorio): ");
  const height = await prompt("height (opcional): ");
  const fit = await prompt("fit (cover|contain|fill|inside|outside, opcional): ");
  const outputPath = sanitizePath(await prompt("Ruta de salida (ej. output.jpg): "));
  const qs: Record<string, string> = { width };
  if (height) qs.height = height;
  if (fit) qs.fit = fit;
  await sendImage("resize", qs, imagePath, outputPath);
}

// Flujo interactivo para crop.
async function cropFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const left = await prompt("left: ");
  const top = await prompt("top: ");
  const width = await prompt("width: ");
  const height = await prompt("height: ");
  const outputPath = sanitizePath(await prompt("Ruta de salida: "));
  await sendImage("crop", { left, top, width, height }, imagePath, outputPath);
}

// Flujo interactivo para rotate.
async function rotateFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const angle = await prompt("angle (90|180|270): ");
  const outputPath = sanitizePath(await prompt("Ruta de salida: "));
  await sendImage("rotate", { angle }, imagePath, outputPath);
}

// Flujo interactivo para format.
async function formatFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const format = await prompt("format (jpeg|png|webp|avif|tiff): ");
  const outputPath = sanitizePath(await prompt("Ruta de salida: "));
  await sendImage("format", { format }, imagePath, outputPath);
}

// Flujo interactivo para filter.
async function filterFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const filter = await prompt("filter (blur|sharpen|grayscale): ");
  const sigma = await prompt("sigma (opcional para blur/sharpen): ");
  const outputPath = sanitizePath(await prompt("Ruta de salida: "));
  const params: Record<string, string> = { filter };
  if (sigma) params.sigma = sigma;
  await sendImage("filter", params, imagePath, outputPath);
}

// Flujo interactivo para pipeline con pasos definidos en JSON.
async function pipelineFlow(): Promise<void> {
  const imagePath = sanitizePath(await prompt("Ruta de la imagen: "));
  const stepsJson = await prompt(
    "Steps en JSON (ej: [{\"type\":\"resize\",\"params\":{\"width\":800}}]): "
  );
  const outputPath = sanitizePath(await prompt("Ruta de salida: "));
  const headers = await authHeader();
  const buffer = await readFile(imagePath);
  const filename = basename(imagePath);
  const mime = contentTypeForExt(extname(filename));
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mime }), filename);
  if (stepsJson) {
    form.append("steps", stepsJson);
  }

  const res = await fetch(`${BASE_URL}/images/pipeline`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  const outBuffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outputPath, outBuffer);
  console.log(`Imagen guardada en ${outputPath}`);
}

// Bucle del submenú de operaciones de imagen.
async function imageMenu(): Promise<void> {
  while (true) {
    printImageMenu();
    const choice = await prompt("Selecciona una opcion: ");
    try {
      if (choice === "1") {
        await resizeFlow();
      } else if (choice === "2") {
        await cropFlow();
      } else if (choice === "3") {
        await rotateFlow();
      } else if (choice === "4") {
        await formatFlow();
      } else if (choice === "5") {
        await filterFlow();
      } else if (choice === "6") {
        await pipelineFlow();
      } else if (choice === "7") {
        break;
      } else {
        console.log("Opcion no valida. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }
}

// Bucle principal del CLI interactivo.
async function main(): Promise<void> {
  console.log("=== CLI interactivo ===");
  while (true) {
    printMenu();
    const choice = await prompt("Selecciona una opcion: ");
    try {
      if (!session.token) {
        if (choice === "1") {
          await register();
        } else if (choice === "2") {
          await login();
        } else if (choice === "3") {
          console.log("Saliendo.");
          break;
        } else {
          console.log("Opcion no valida. Intenta de nuevo.");
        }
      } else {
        if (choice === "1") {
          const url = await prompt("Nueva API_BASE_URL (ej. http://localhost:4000): ");
          if (url) {
            BASE_URL = url;
            console.log(`API_BASE_URL actualizada a ${BASE_URL}`);
          }
        } else if (choice === "2") {
          await imageMenu();
        } else if (choice === "3") {
          session.token = null;
          session.email = null;
          console.log("Sesión cerrada.");
        } else if (choice === "4") {
          console.log("Saliendo.");
          break;
        } else {
          console.log("Opcion no valida. Intenta de nuevo.");
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }
}

main().catch((err) => {
  console.error("Error en CLI:", err);
  process.exit(1);
});
