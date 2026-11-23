# Plan de Mantenimiento — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Principios

- Cambios pequeños, revisados y con CI verde.
- Ningún cambio de esquema sin migración y prueba.
- Ninguna ruta sensible sin autorización y logging.
- Documentación actualizada en el mismo cambio.

## 2. Calendario

| Frecuencia | Tarea |
|---|---|
| Diaria | Revisar logs 5xx, health/ready, backups, espacio en disco |
| Semanal | Revisar dependency alerts, errores de frontend, performance p95 |
| Mensual | Restauración de prueba, rotación de credenciales operativas, revisión de usuarios |
| Trimestral | Auditoría de permisos, revisión de índices, prueba de rollback |
| Semestral | Actualización mayor controlada de framework y Prisma |
| Anual | Auditoría de seguridad externa y revisión de arquitectura |

## 3. Dependencias

- Ejecutar `npm audit` en backend y frontend en cada CI.
- Aplicar parches de seguridad dentro de 7 días para severidad alta.
- Actualizaciones mayores en rama de prueba con E2E completo.
- Mantener Node 22 LTS en contenedores.

## 4. Base de datos

- Toda migración debe ser compatible hacia adelante cuando sea posible.
- Verificar índices con `EXPLAIN` si cambian filtros de búsqueda.
- Revisar `pg_stat_user_tables` y `pg_stat_user_indexes` mensualmente.
- No almacenar secretos ni binarios nuevos en columnas `bytea`.
- Programar `VACUUM ANALYZE` según crecimiento.

## 5. Seguridad

- Rotar `JWT_SECRET`, `JWT_REFRESH_SECRET` y passwords seed tras incidente.
- Revisar `User.tokenVersion` y usuarios inactivos.
- Mantener CSP, CORS y HSTS revisados en cada deploy.
- Migrar sesión a cookies httpOnly en siguiente fase.
- Fijar `connect-src` al dominio exacto de API.

## 6. Backups

- Confirmar backup diario automático y offsite.
- Restauración mensual documentada.
- Verificar snapshot del volumen `unior_storage`.
- Registrar hashes y tamaño de dumps.

## 7. Observabilidad

- Añadir alertas por tasa de 5xx, p95, latencia de DB y espacio de storage.
- Correlacionar logs con `X-Request-ID`.
- Dashboard sugerido: RPS, errores, p95, downloads, uploads, migraciones, backups.

## 8. Checklist de cambio

```text
[ ] CI verde
[ ] Migración revisada
[ ] Permisos revisados
[ ] E2E real ejecutado
[ ] Backup reciente
[ ] Rollback documentado
[ ] Documentos actualizados
```

## 9. Deuda priorizada

1. Object storage como fuente única de binarios.
2. Cookies httpOnly.
3. PITR automatizado.
4. Worker de embargos con lock distribuido.
5. Monitoreo y alertas externas.

## 10. Estado

El repositorio cuenta con CI, tests, E2E, backups verificados y documentación operativa. El plan de mantenimiento debe ejecutarse con responsables asignados a partir del primer despliegue productivo.
