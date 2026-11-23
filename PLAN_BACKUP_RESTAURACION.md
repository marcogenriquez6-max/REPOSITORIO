# Plan de Backup y Restauración — Repositorio Institucional UNIOR

Fecha: 2026-11-23

## 1. Objetivos

- **RPO objetivo**: ≤ 24 horas en MVP; ≤ 15 minutos con PITR.
- **RTO objetivo**: ≤ 60 minutos para base de datos; ≤ 2 horas incluyendo binarios.
- **Retención**: 30 días diarios, 12 semanales, 12 mensuales.

## 2. Alcance

1. PostgreSQL: esquema, datos, metadatos, usuarios y logs.
2. Binarios: archivos bajo `/app/storage`.
3. Configuración: `.env` cifrado en gestor de secretos, nunca en backup plano.

## 3. Backup ejecutado y verificado

Se ejecutó un backup real con `pg_dump -Fc` sobre la base local `unior_repo`:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" repositorio-db-1 \
  pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > unior-backup.dump
```

Resultado: archivo de 50K.
Restauración en BD aislada `unior_restore_test`: correcta.
Conteos verificados: 12 ítems, 3 bitstreams.

## 4. Procedimiento de restauración

```bash
# 1. Crear BD de prueba o destino
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" repositorio-db-1 \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d postgres \
  -c 'DROP DATABASE IF EXISTS unior_restore_test' \
  -c 'CREATE DATABASE unior_restore_test'

# 2. Restaurar
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i repositorio-db-1 \
  pg_restore -h 127.0.0.1 -U "$POSTGRES_USER" -d unior_restore_test \
  --clean --if-exists --no-owner --no-privileges < unior-backup.dump

# 3. Verificar
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" repositorio-db-1 \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d unior_restore_test -Atc 'select count(*) from items'

# 4. Sincronizar binarios desde el volumen respaldado a STORAGE_ROOT
```

Antes de restaurar producción: detener API, crear backup del estado actual, ejecutar migraciones compatible y validar integridad.

## 5. Automatización pendiente

- Programar `pg_dump` diario en el proveedor o cron de Fly.
- Subir dumps cifrados a object storage con retención.
- Activar PITR/WAL archiving en PostgreSQL administrado.
- Alarmar si no hay backup exitoso en 26 horas.
- Backup del volumen `unior_storage` junto con la DB, con el mismo timestamp.

## 6. Prueba de restauración periódica

- Frecuencia: mensual.
- Checklist: backup reciente, hash verificado, restauración aislada, conteos, login de prueba, descarga de PDF, limpieza de BD temporal.
- Registrar resultado en este documento.

## 7. Observaciones

El backup ejecutado cubre la base de datos. El volumen de archivos debe respaldarse por separado mediante snapshot del proveedor o sincronización a object storage. Hasta automatizarlo, el RPO real depende de la disciplina operativa.
