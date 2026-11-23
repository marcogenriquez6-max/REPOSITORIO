# Auditoría de Seguridad — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Resumen ejecutivo

Estado inicial: 0 críticos, 6 altos, 10 medios, 11 bajos.
Estado actual: 0 críticos y 0 altos abiertos; 4 medios/bajos requieren trabajo continuo de infraestructura.

`npm audit --omit=dev` reportó 0 vulnerabilidades en backend y frontend.

## 2. Controles implementados

### Autenticación y sesión
- Access JWT de 15 min y refresh de 7 días con secrets fuertes y distintos.
- `User.tokenVersion` agregado; logout incrementa la versión y revoca todos los tokens.
- Refresh firma nuevo access con la versión vigente y rechaza versiones desactualizadas.
- `/auth/me` hidrata la sesión real al cargar la app.
- Eventos `unior:auth-refreshed` y `unior:session-expired` sincronizan interceptors y UI.

### Autorización
- `authorize(...roles)` y `authorizeReviewerScope()` en rutas de revisión.
- Revisores deben tener ámbito y, salvo PUBLICADO/EMBARGADO, asignación explícita.
- Admin puede operar globalmente; depositante solo responde observaciones de sus propios ítems en `OBSERVADO`.
- Descarga de binarios: propietario, admin o revisor asignado. Verificado 403/200.

### Transporte y headers
- Helmet con CSP backend.
- CSP frontend en nginx y Netlify: `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'self' blob:`, `connect-src` restringido.
- CORS estricto por lista de orígenes.
- `X-Request-ID`, `Vary: Authorization`, `Cache-Control: private, no-store` en descargas.

### Entrada y archivos
- Validación Zod en todas las rutas con body/query.
- Multer con límite de tamaño, MIME PDF y verificación de firma `%PDF-` y `%%EOF`.
- Hash SHA-256.
- Path traversal mitigado con `path.relative`.
- Sanitización de nombres en `Content-Disposition`.

### Observabilidad y abuso
- Rate limit por IP con `Retry-After`.
- Log estructurado de errores 500.
- Health y readiness separados.
- Request-id propagado.

## 3. Hallazgos resueltos

| ID | Hallazgo | Resolución |
|---|---|---|
| S-01 | CORS no cubría 127.0.0.1 | Orígenes configurables verificados |
| S-02 | Refresh tokens irrevocables | `tokenVersion` + logout |
| S-03 | Sin CSP frontend | CSP en nginx/Netlify |
| S-04 | Revisor sin ámbito/asignación podía operar | Doble control middleware + servicio |
| S-05 | Binarios filtrados por ámbito | Descarga solo a asignados |
| S-06 | Path traversal en filePath | `path.relative` |
| S-07 | 500 sin log | Log con request-id |
| S-08 | Rate limit por socket | `req.ip` + trust proxy |
| S-09 | Checks de catálogo falsos | Metadata real `programa`/`area` |
| S-10 | Asignación de revisor sin validar | Estado, ámbito y versión |

## 4. Observaciones abiertas

1. **Medio**: tokens en `localStorage`; migrar a cookies `httpOnly`, `secure`, `sameSite`.
2. **Medio**: CSP `connect-src` usa `https:` amplio; fijar dominio exacto de API.
3. **Medio**: binarios duplicados en `bytea` y filesystem; consolidar en object storage con URLs firmadas.
4. **Bajo**: falta rotación periódica automatizada de secrets y auditoría de accesos.

## 5. Datos sensibles

No se registraron passwords, JWTs ni secretos en documentación, logs de prueba ni chat. `.env` permanece ignorado por Git.

## 6. Conclusión

El nivel de seguridad actual es adecuado para el MVP con despliegue controlado. Las observaciones abiertas son mejoras arquitectónicas, no bloqueantes funcionales inmediatos, salvo fijar `connect-src` y el dominio de API antes de exposición pública.
