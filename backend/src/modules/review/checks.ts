import { BitstreamBundle } from '@prisma/client';

export const CHECK_DEFS = [
  { key: 'dc.title', label: 'Título correctamente registrado', mandatory: true },
  { key: 'dc.contributor.author', label: 'Autores identificados', mandatory: true },
  { key: 'dc.contributor.advisor', label: 'Tutor registrado cuando corresponda', mandatory: false },
  { key: 'programa', label: 'Programa académico registrado', mandatory: true },
  { key: 'area', label: 'Área registrada', mandatory: true },
  { key: 'dc.date.issued', label: 'Año correcto', mandatory: true },
  { key: 'dc.description.abstract', label: 'Resumen registrado', mandatory: true },
  { key: 'dc.subject', label: 'Palabras clave registradas', mandatory: true },
  { key: 'archivo_pdf', label: 'Archivo PDF válido', mandatory: true },
  { key: 'metadatos_obligatorios', label: 'Metadatos obligatorios completos', mandatory: true },
] as const;

export interface ItemForChecks {
  metadata: Array<{ schema: string; element: string; qualifier: string | null; value: string }>;
  bitstreams: Array<{ bundle: BitstreamBundle; isPrimary: boolean; mimeType: string; sha256Hash: string }>;
  collection: { name: string; community: { name: string } };
}

export function hasDc(meta: ItemForChecks['metadata'], element: string, qualifier?: string | null): boolean {
  return meta.some((m) => m.schema === 'dc'
    && m.element === element
    && (qualifier === undefined || (m.qualifier ?? null) === (qualifier ?? null))
    && (m.value?.trim()?.length ?? 0) > 0);
}

function dcValue(meta: ItemForChecks['metadata'], element: string, qualifier?: string | null): string | undefined {
  return meta.find((m) => m.schema === 'dc' && m.element === element
    && (qualifier === undefined || (m.qualifier ?? null) === (qualifier ?? null)))?.value;
}

export function computeChecks(item: ItemForChecks): Record<string, boolean> {
  const year = dcValue(item.metadata, 'date', 'issued')?.trim() ?? '';
  const yearOk = /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= new Date().getFullYear() + 1;
  const original = item.bitstreams.find((b) => b.bundle === BitstreamBundle.ORIGINAL && b.isPrimary);
  return {
    'dc.title': hasDc(item.metadata, 'title', null),
    'dc.contributor.author': hasDc(item.metadata, 'contributor', 'author'),
    'dc.contributor.advisor': hasDc(item.metadata, 'contributor', 'advisor'),
    programa: hasDc(item.metadata, 'subject', 'programa'),
    area: hasDc(item.metadata, 'subject', 'area'),
    'dc.date.issued': yearOk,
    'dc.description.abstract': hasDc(item.metadata, 'description', 'abstract'),
    'dc.subject': hasDc(item.metadata, 'subject'),
    archivo_pdf: !!original && original.mimeType === 'application/pdf' && /^[a-f0-9]{64}$/.test(original.sha256Hash),
    metadatos_obligatorios: hasDc(item.metadata, 'title', null)
      && hasDc(item.metadata, 'contributor', 'author')
      && hasDc(item.metadata, 'date', 'issued')
      && hasDc(item.metadata, 'description', 'abstract')
      && hasDc(item.metadata, 'type', null)
      && hasDc(item.metadata, 'rights', null),
  };
}
