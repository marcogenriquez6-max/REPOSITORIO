# Resultados de Pruebas — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Pruebas estáticas y de build

| Comando | Resultado |
|---|---|
| `npx prisma generate` | Prisma Client v5.22.0 generado |
| `npx prisma migrate deploy` | 6 migraciones aplicadas, incluida `20261123010000_token_version` |
| `npx prisma validate` | Schema válido |
| `npm run build` (backend) | Correcto |
| `npm test` (backend) | 4 archivos, 20/20 tests |
| `npm run build` (frontend) | Correcto, 1742 módulos |
| `npm audit --omit=dev` backend/frontend | 0 vulnerabilidades |
| `docker compose config --quiet` | Correcto |
| `docker build -f backend/Dockerfile` | Imagen `unior-backend:ci` construida |
| `docker build -f frontend/Dockerfile` | Imagen `unior-frontend:ci` construida |

## 2. Humo en vivo

| Verificación | Resultado |
|---|---|
| `GET /api/v1/health` | 200 |
| `GET /api/v1/health/ready` | 200 |
| CORS `Origin: http://127.0.0.1:5173` | `Access-Control-Allow-Origin` correcto, `Vary: Origin`, credenciales permitidas |
| `/handle/unior/{id}` | 302 → `/items/{id}` |
| `POST /auth/logout` | 200 |
| Refresh posterior al logout | 401 |
| Headers imagen frontend | CSP, `no-store` en index, `immutable` en assets |
| Entrypoint backend | `uid=1000` (no root) |

## 3. E2E real

Script: `C:/Users/Equipo/AppData/Local/Temp/opencode/e2e-real.sh`
PDF: `unior-e2e-real.pdf` · 218 bytes.

1. Login depositante y admin.
2. Colección real obtenida desde facets.
3. Ítem creado: `610ad89b-6ef0-4d6c-a575-13040410c7e6`.
4. Bitstream: `17f23c07-e38b-412a-acef-2dce793053a5`.
5. `BORRADOR → EN_REVISION`.
6. 10 checks guardados.
7. Devolución → `OBSERVADO`.
8. Observación respondida por depositante → `RESUELTA`.
9. Resubmit → `EN_REVISION`.
10. Aprobación → `PUBLICADO`.
11. Búsqueda pública: 2 resultados, primero el ítem creado.
12. Detalle público sin `content`, `filePath` ni `sha256Hash`.
13. Descarga HTTP 200, firma `%PDF-`, 218 bytes.

## 4. Control de acceso a binarios

Ítem de prueba: `17a3debf-1c27-4a60-947b-a6c9ec778b97`
Bitstream: `3bd4676a-e3b0-4973-971c-7bd20d5ae267`

| Escenario | Resultado |
|---|---|
| Revisor con ámbito, sin asignación | 403 |
| Asignación por admin | 200 |
| Descarga del revisor asignado | 200 |

## 5. Backup y restauración

- `pg_dump -Fc` generó `unior-backup.dump` de 50K.
- Restauración en `unior_restore_test` correcta.
- Conteos verificados: 12 ítems y 3 bitstreams.
- BD de prueba eliminada.

## 6. Carga ligera

400 peticiones, concurrencia 20, URLs health y search.

```json
{"total":400,"concurrency":20,"ok":400,"err":0,"p50_ms":43,"p95_ms":291,"p99_ms":499,"max_ms":635}
```

## 7. Estado final

Todas las pruebas ejecutadas pasaron. Quedan pendientes prueba de carga sostenida, monitoreo externo y backup automático offsite/PITR, documentados en los planes respectivos.
