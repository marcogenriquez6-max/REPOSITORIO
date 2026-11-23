# Arquitectura y Escalabilidad a 10 Años — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Arquitectura actual

```
Cliente React (SPA)
  → Nginx/Netlify (CSP, caché, SPA fallback)
  → API Express (/api/v1)
      → PostgreSQL 16 (Prisma)
      → Storage local montado (/app/storage)
      → Job de embargos (in-process, cada 6 h)
```

Fortalezas: contratos tipados, separación de capas, validación centralizada, transacciones en flujo crítico, Health/ready, CI y contenedores reproducibles.

Limitaciones: storage local acoplado a la instancia, binarios duplicados en DB y disco, job de embargos en memoria, sesión en `localStorage`, seguimiento centralizado pendiente.

## 2. Decisiones ya aplicadas

- **ADR-001**: Prisma como única capa de acceso; migraciones versionadas.
- **ADR-002**: API REST con prefijo `/api/v1` y contratos Zod + tipos frontend.
- **ADR-003**: Control de acceso por rol + ámbito jerárquico + asignación.
- **ADR-004**: Storage configurable por `STORAGE_ROOT`, volumen en Fly y entrypoint no-root.
- **ADR-005**: CI obligatoria antes de despliegue.
- **ADR-006**: Logging de 500 y request-id para diagnóstico.

## 3. Arquitectura objetivo por fases

### Fase 1 — Producción controlada (0-3 meses)
- Volumen durable `unior_storage` en Fly y backups automáticos offsite.
- Fijar CORS/CSP al dominio real.
- Monitoreo: logs centralizados, alertas de 5xx, latencia p95 y disco.
- Ejecutar prueba de carga sostenida y definir SLOs.

### Fase 2 — Desacoplamiento (3-12 meses)
- Object storage compatible S3 como fuente única de binarios; quitar `bytea`.
- URLs firmadas de corta duración para preview/descarga.
- Mover job de embargos a `pg_cron` o worker dedicado con lock distribuido.
- Cookies httpOnly para sesión.
- Read replicas para búsqueda y reportes.

### Fase 3 — Escala institucional (1-3 años)
- Índice de búsqueda dedicado (OpenSearch/Meilisearch) si crece el corpus.
- Eventos de dominio para auditoría e integraciones (DOI, ORCID, repositorios aliados).
- Multi-región con replicación y failover probado.

### Fase 4 — Sostenibilidad (3-10 años)
- Contratos de API versionados con deprecación planificada.
- Política de retención y archivado de metadatos.
- Renovación programada de dependencias y auditoría anual.
- Documentación Decision Records para cada cambio estructural.

## 4. Modelo de escalabilidad

| Dimensión | Hoy | Objetivo |
|---|---|---|
| API | 1-2 réplicas Fly | Auto-scaling por CPU/conexiones |
| DB | PostgreSQL 16, 1 instancia | Primaria + réplica de lectura + PITR |
| Binarios | Volumen local | Object storage + CDN |
| Búsqueda | SQL/ILIKE + trigram | Motor de búsqueda dedicado |
| Jobs | In-process | Worker con cola/idempotencia |
| Observabilidad | Logs de app | Logs, métricas y trazas centralizadas |

## 5. Riesgos arquitectónicos

1. Acoplamiento al filesystem local si Fly no crea el volumen antes del deploy.
2. Duplicidad `bytea`/disco puede generar inconsistencia.
3. Crecimiento de `ILIKE` sin índices adecuados en búsquedas complejas.
4. Jobs in-process se ejecutan por réplica; requieren locking al escalar.

## 6. Principios de mantenimiento

- Preferir migraciones pequeñas y reversibles.
- Ningún cambio de esquema sin índice y prueba de consulta asociada.
- Toda acción sensible debe quedar en `workflow_logs`.
- Toda ruta nueva debe tener validación, autorización y prueba.

## 7. Conclusión

La base actual es adecuada para crecer, siempre que se ejecuten las fases 1 y 2. La arquitectura a 10 años no requiere reescribir el sistema, sino sustituir puntos concretos de acoplamiento por servicios administrados.
