-- Optimize metadata discovery/search (title, author, year) with pg_trgm and targeted indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Título (dc.title)
CREATE INDEX IF NOT EXISTS idx_mv_title_trgm
ON "metadata_values" USING gin (value gin_trgm_ops)
WHERE schema = 'dc' AND element = 'title' AND qualifier IS NULL;

-- Autor (dc.contributor.author)
CREATE INDEX IF NOT EXISTS idx_mv_author_trgm
ON "metadata_values" USING gin (value gin_trgm_ops)
WHERE schema = 'dc' AND element = 'contributor' AND qualifier = 'author';

-- Asesor/Tutor (dc.contributor.advisor)
CREATE INDEX IF NOT EXISTS idx_mv_advisor_trgm
ON "metadata_values" USING gin (value gin_trgm_ops)
WHERE schema = 'dc' AND element = 'contributor' AND qualifier = 'advisor';

-- Palabras clave / resumen (para coincidencias parciales)
CREATE INDEX IF NOT EXISTS idx_mv_subject_trgm
ON "metadata_values" USING gin (value gin_trgm_ops)
WHERE schema = 'dc' AND element = 'subject';

CREATE INDEX IF NOT EXISTS idx_mv_abstract_trgm
ON "metadata_values" USING gin (value gin_trgm_ops)
WHERE schema = 'dc' AND element = 'description' AND qualifier = 'abstract';

-- Año (dc.date.issued) - prefijo YYYY
CREATE INDEX IF NOT EXISTS idx_mv_year_issued
ON "metadata_values" ((substring(value from 1 for 4)))
WHERE schema = 'dc' AND element = 'date' AND qualifier = 'issued';
