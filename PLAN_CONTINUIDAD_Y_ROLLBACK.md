# Plan de Continuidad y Rollback — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Objetivos

- Mantener disponible el repositorio ante fallos de app, BD, storage o deploy.
- Recuperar sin pérdida silenciosa de metadatos ni binarios.
- Rollback predecible y auditado.

## 2. SLOs propuestos

| Servicio | Disponibilidad | Latencia p95 |
|---|---:|---:|
| API health/ready | 99.9% | < 200 ms |
| Búsqueda | 99.5% | < 800 ms |
| Descarga PDF | 99.5% | < 2 s |

Referencia local: 400 peticiones, 0 errores, p95 291 ms.

## 3. Escenarios y respuesta

| Escenario | Acción inmediata |
|---|---|
| 5xx elevados | Revisar `fly logs` con `X-Request-ID`, verificar DB y rollback si coincide con deploy |
| DB no disponible | `health/ready` falla; revisar proveedor, conexión y secrets; no reiniciar app en bucle |
| Volumen storage lleno | Limpiar temporales, ampliar volumen, verificar uploads |
| Migración incompatible | Restaurar backup y redeploy imagen anterior |
| CSP bloquea API | Ajustar `connect-src` y redeploy frontend |
| Pérdida de binarios | Restaurar volumen y validar hashes contra bitstreams |

## 4. Rollback de aplicación

```bash
fly releases
fly releases rollback
# o
fly deploy -i <tag-anterior>
```

Comprobaciones posteriores: health/ready, login, búsqueda, descarga PDF y ausencia de 500 en logs.

## 5. Rollback de base de datos

1. Declarar incidente y detener escrituras si es posible.
2. Descargar backup previo al deploy.
3. Restaurar en BD de validación según `PLAN_BACKUP_RESTAURACION.md`.
4. Verificar conteos y consultas críticas.
5. Restaurar en producción y ejecutar `npx prisma migrate deploy` solo si la versión de app lo requiere.
6. Sincronizar binarios si el backup incluye storage.

## 6. Checklists

### Antes de deploy
- CI verde.
- Backup reciente verificado.
- Secrets presentes.
- Volumen creado.
- Dominio y CORS/CSP correctos.

### Durante incidente
- Registrar hora de inicio y responsable.
- Identificar último cambio.
- Preservar logs y request-id.
- Decidir rollback o hotfix.

### Después
- Postmortem con causa, impacto y acción correctiva.
- Actualizar este plan y pruebas.

## 7. Responsabilidades

| Rol | Responsabilidad |
|---|---|
| DevOps | Deploy, secrets, backups, monitoreo |
| Backend | Migraciones, logs, health, rollout |
| Frontend | CSP, contratos API, UX de error |
| DBA | Integridad, PITR, restauración |

## 8. Estado actual

Existen health/ready, logging, CI, volumen durable y backup verificado. Faltan alertas externas, PITR automático y prueba de failover multi-región.
