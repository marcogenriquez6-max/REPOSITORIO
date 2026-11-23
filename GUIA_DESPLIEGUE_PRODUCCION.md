# Guía de Despliegue a Producción — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Requisitos previos

- Repositorio con el commit aprobado.
- Cuentas de Fly.io, Netlify y proveedor de PostgreSQL administrado.
- Secrets generados aleatoriamente: `JWT_SECRET`, `JWT_REFRESH_SECRET`, passwords seed, `POSTGRES_PASSWORD`.
- Dominio propio y certificado TLS.
- Volumen Fly creado antes del primer deploy.

## 2. Variables obligatorias

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://repositorio.unior.edu.bo
PUBLIC_BASE_URL=https://repositorio.unior.edu.bo
API_PREFIX=/api/v1
PORT=4000
STORAGE_ROOT=/app/storage
```

Reglas:
- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser distintos y suficientemente largos.
- No versionar `.env`.
- Rotar secrets después de cualquier incidente.

## 3. Despliegue local con Docker Compose

```bash
cp .env.example .env
# editar .env con valores reales
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:4000/api/v1/health
curl http://127.0.0.1:4000/api/v1/health/ready
```

El command del backend ejecuta `prisma migrate deploy` antes de iniciar.

## 4. Despliegue API en Fly.io

```bash
fly volumes create unior_storage --region ams --size 10
fly secrets set DATABASE_URL='...' JWT_SECRET='...' JWT_REFRESH_SECRET='...' \
  CORS_ORIGIN='https://repositorio.unior.edu.bo' \
  PUBLIC_BASE_URL='https://repositorio.unior.edu.bo'
fly deploy
fly logs
fly status
```

`fly.toml` ya contiene:
- `release_command = "npx prisma migrate deploy"`.
- Healthcheck en `/api/v1/health/ready`.
- `min_machines_running = 1`.
- Volumen `unior_storage` montado en `/app/storage`.

## 5. Despliegue frontend en Netlify

- Base: `frontend`.
- Build: `npm run build`.
- Publish: `dist`.
- Variable: `VITE_API_URL=https://api.unior.edu.bo/api/v1`.

`netlify.toml` incluye redirects SPA, CSP, HSTS y caché inmutable para assets.

## 6. Verificación post-despliegue

| Verificación | Esperado |
|---|---|
| `GET /api/v1/health/ready` | 200 |
| CORS con origen real | Dominio exacto en `Access-Control-Allow-Origin` |
| CSP del frontend | Headers presentes |
| `/handle/unior/{uuid}` | 302 a `/items/{uuid}` |
| Login seed | 200 |
| Upload PDF | 201 |
| Descarga pública | 200 + `%PDF-` |
| `fly logs` | Sin 500 |

## 7. Rollback rápido

```bash
fly deploy -i <imagen-anterior>
fly releases
fly releases rollback
```

Si la migración es incompatible, restaurar BD según `PLAN_BACKUP_RESTAURACION.md` antes de redeploy.

## 8. Consideraciones

- El volumen Fly debe existir en la misma región que la app.
- Antes de exponer públicamente, fijar `connect-src` de CSP al dominio real de API.
- Configurar monitoreo y alertas según `PLAN_CONTINUIDAD_Y_ROLLBACK.md`.
