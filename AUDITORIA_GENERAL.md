# Auditoría General — Repositorio Institucional UNIOR

Fecha: 2026-11-23
Rama: `master` · Base: `b431324`
Repositorio: `C:/Users/Equipo/AppData/Local/Temp/opencode/REPOSITORIO`

## 1. Alcance

Auditoría integral de código, API, frontend, PostgreSQL/Prisma, infraestructura, seguridad funcional, despliegue y preparación para producción. Se incluyeron inventario VERY THOROUGH de módulos, revisión de permisos, flujo de trabajo, metadatos Dublin Core, binarios, descubrimiento, CORS, logging, CI/CD, backups y escalabilidad a 10 años.

## 2. Estado general

| Área | Estado antes | Estado actual |
|---|---|---|
| Funcionalidad MVP | Operativa | Operativa y verificada E2E |
| Seguridad | 6 hallazgos ALTOS | 0 altos abiertos; observaciones medias pendientes |
| Base de datos | Sin backup verificado | Backup/restore real ejecutado |
| Permisos revisores | Bypass de ámbito/asignación | Corregido y verificado |
| Refresh tokens | Sin revocación efectiva | Rotación/revocación por `tokenVersion` |
| Despliegue | Sin CI, migraciones manuales | CI, `release_command`, volumen durable |
| Observabilidad | 500 sin log | Request-id + log de 500 + health/ready |
| Escalabilidad 10 años | Insuficiente | Plan documentado; base preparada |

## 3. Hallazgos críticos/altos corregidos

1. **CORS restringido incorrectamente**: se permitía `localhost` pero no `127.0.0.1`. Corregido; verificado con `Origin: http://127.0.0.1:5173`.
2. **Refresh tokens sin revocación real**: agregado `User.tokenVersion`, incremento en logout y validación en access/refresh.
3. **Tokens sin CSP en frontend**: CSP agregada en `nginx.conf` y `netlify.toml`; verificada en imagen built.
4. **Migraciones no ejecutadas en Fly**: agregado `[deploy].release_command = "npx prisma migrate deploy"` y Prisma CLI en dependencias de producción.
5. **Storage sin volumen durable**: configurado `[mounts]` en `fly.toml`; entrypoint aplica permisos y ejecuta como `node`.
6. **Errores 500 sin registro**: middleware registra `requestId`, `method`, `path`, `code` y stack.
7. **Rate limit por logger address**: ahora usa `req.ip` detrás de `trust proxy`.
8. **`handleUri` roto**: ruta raíz `/handle/unior/:itemId` redirige 302 a `/items/:id`; frontend también resuelve la ruta.
9. **Depositante sin respuesta de observaciones**: nuevo `PATCH /review/observations/:id/respond`, UI en `EditDepositPanel`.
10. **Revisores con ámbito eludían asignación**: `assertAccess` exige ámbito y asignación salvo PUBLICADO/EMBARGADO.
11. **Binarios filtrados por ámbito**: `/files/:id/download` exige propietario, admin o revisor asignado; verificado 403→200.
12. **Checks `programa`/`area` falsos**: ahora validan metadatos reales `dc.subject` con qualifier.
13. **Path traversal en descargas**: validación con `path.relative`.
14. **Asignación de revisor sin control**: valida estado, ámbito y versión optimista.
15. **Embargos vencidos nunca se publicaban**: job cada 6 horas.
16. **Sin CI**: GitHub Actions con build/test/audit/Docker.

## 4. Estado de datos

- PostgreSQL 16.15, base `unior_repo`, 6 migraciones aplicadas.
- Conteo final: 12 ítems, 114 valores de metadatos, 3 bitstreams, 3 usuarios.
- Backup `pg_dump -Fc` de 50K restaurado en BD aislada: 12 ítems y 3 bitstreams verificados.

## 5. Verificación

- Backend: `npx prisma generate`, `npx prisma migrate deploy`, `npm run build`, `npm test` → 20/20.
- Frontend: `npm run build` correcto.
- Imágenes Docker backend/frontend construidas correctamente.
- `docker compose config --quiet` y `npx prisma validate` correctos.
- `npm audit --omit=dev` → 0 vulnerabilidades en backend y frontend.
- E2E real completado: depósito → PDF → submit → checks → devolución → respuesta → resubmit → aprobación → búsqueda → detalle → descarga.
- Carga ligera: 400 peticiones, concurrencia 20, 0 errores, p95 291 ms.

## 6. Observaciones abiertas

- Backups aún no son automáticos ni offsite; PITR completo debe configurarse en el proveedor.
- Almacenamiento sigue dual (`bytea` + archivo); migrar a una sola fuente (object storage) en siguiente fase.
- `connect-src` de CSP debe fijarse al dominio real de API en producción.
- Falta monitoreo/alertas externas y dashboard de métricas.
- Pruebas de carga realizadas son de smoke; ejecutar prueba sostenida antes de alto tráfico.

## 7. Dictamen

**APTO CON OBSERVACIONES**. El sistema es funcional, seguro para el MVP y está listo para despliegue controlado en entorno de producción siempre que se completen las observaciones de infraestructura antes de exposición pública amplia. No se realizó commit ni push.
