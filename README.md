# Image Manipulation API

API REST en TypeScript con Express, Sharp y MongoDB. Incluye autenticación JWT, logging con Decorator, y operaciones de imagen expuestas como servicio.

## Requisitos
- Node.js 20+
- MongoDB en ejecución

## Instalación
```
npm install
```

## Variables de entorno
Ver `.env.example` y crea un `.env`.

Claves principales:
- `MONGO_URI`: cadena de conexión MongoDB.
- `JWT_SECRET`: secreto para firmar JWT.
- `JWT_EXPIRES_IN`: duración del JWT (ej. `1h`, `2d`).
- `PORT`: puerto del servidor.
- `LOG_PATH`: ruta para logs JSONL.

## Scripts
- `npm run dev` — modo desarrollo con recarga
- `npm run build` — compila a `dist`
- `npm start` — ejecuta desde `dist`
- `npm run cli` — ejecuta el menú interactivo (requiere API corriendo)

## Endpoints principales
- POST /auth/register
- POST /auth/login
- POST /images/resize
- POST /images/crop
- POST /images/format
- POST /images/rotate
- POST /images/filter
- POST /images/pipeline (opcional)

### Salud
- GET /health → { "status": "ok" }

## Ejecución
```
npm run dev
```

## CLI interactivo (registro/login + imágenes por terminal)
- Arranca la API en otra terminal (`npm run dev` o `npm start`).
- Ejecuta:
```
npm run cli
```
- Menú (sin sesión): 1) Registrarse  2) Login  3) Salir.
- Menú (con sesión): 1) Cambiar API_BASE_URL  2) Operaciones de imagen  3) Cerrar sesión  4) Salir.
- Submenú de imágenes: resize, crop, rotate, format, filter, pipeline. Pide ruta de archivo local, parámetros y ruta de salida (se guarda en tu máquina; el servidor no almacena).
- Puedes cambiar `API_BASE_URL` si la API no está en http://localhost:4000.

## Notas
- Todas las rutas de imágenes requieren `Authorization: Bearer <token>`.
- Límite de archivo: 10MB. Campo: `image` en multipart/form-data.

## Ejemplos de uso (curl)

Autenticación
- Registro:
```
curl -X POST http://localhost:4000/auth/register \
	-H "Content-Type: application/json" \
	-d '{"email":"user@example.com","password":"Secret123!"}'
```
- Login (devuelve `token`):
```
curl -X POST http://localhost:4000/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"user@example.com","password":"Secret123!"}'
```

Imágenes (todas con `-H "Authorization: Bearer <token>"`)
- Resize (ancho obligatorio, alto opcional):
```
curl -X POST "http://localhost:4000/images/resize?width=800&height=600&fit=cover" \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-o resized.jpg
```
- Crop:
```
curl -X POST "http://localhost:4000/images/crop?left=10&top=10&width=300&height=300" \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-o cropped.jpg
```
- Format (format: jpeg|png|webp|avif|tiff):
```
curl -X POST "http://localhost:4000/images/format?format=webp" \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-o output.webp
```
- Rotate (angle: 90|180|270):
```
curl -X POST "http://localhost:4000/images/rotate?angle=90" \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-o rotated.jpg
```
- Filter (filter: blur|sharpen|grayscale, sigma opcional para blur/sharpen):
```
curl -X POST "http://localhost:4000/images/filter?filter=grayscale" \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-o gray.jpg
```
- Pipeline (JSON de pasos):
```
curl -X POST http://localhost:4000/images/pipeline \
	-H "Authorization: Bearer <token>" \
	-F "image=@./sample.jpg" \
	-F 'steps=[
		{"type":"resize","params":{"width":800,"height":600,"fit":"cover"}},
		{"type":"format","params":{"format":"webp"}}
	]' \
	-o result.webp
```
