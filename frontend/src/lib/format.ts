import type { Item, ItemStatus, Role } from '../types';

export const STATUS_LABELS: Record<ItemStatus, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  PUBLICADO: 'Publicado',
  EMBARGADO: 'Embargado',
};

export const STATUS_BADGES: Record<ItemStatus, string> = {
  BORRADOR: 'badge-slate',
  EN_REVISION: 'badge-gold',
  OBSERVADO: 'badge-amber',
  PUBLICADO: 'badge-green',
  EMBARGADO: 'badge-purple',
};

export const STATUS_DESCRIPTIONS: Record<ItemStatus, string> = {
  BORRADOR: 'Aún no ha sido enviado a revisión.',
  EN_REVISION: 'El comité académico está evaluando el documento.',
  OBSERVADO: 'Requiere correcciones antes de volver a revisión.',
  PUBLICADO: 'Visible y descargable para toda la comunidad.',
  EMBARGADO: 'Metadatos visibles; la descarga se habilita al vencer el embargo.',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  REVISOR: 'Revisor',
  DEPOSITANTE: 'Depositante',
};

export const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  OBSERVACION: 'Observación',
  DEVOLUCION: 'Devolución',
  RECHAZO: 'Rechazo',
};

export function meta(item: Pick<Item, 'metadata'>, element: string, qualifier?: string | null): string {
  const found = item.metadata?.find(
    (m) => m.element === element && (qualifier === undefined || (m.qualifier ?? null) === qualifier),
  );
  return found?.value ?? '';
}

export function metaAll(item: Pick<Item, 'metadata'>, element: string, qualifier?: string | null): string[] {
  return (item.metadata ?? [])
    .filter((m) => m.element === element && (qualifier === undefined || (m.qualifier ?? null) === qualifier))
    .map((m) => m.value);
}

export function itemTitle(item: Pick<Item, 'metadata'>): string {
  return meta(item, 'title') || 'Documento sin título';
}

export function itemAuthors(item: Pick<Item, 'metadata'>): string {
  return metaAll(item, 'contributor', 'author').join(', ');
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? date.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString('es-BO', { dateStyle: 'medium' });
}

export function formatBytes(value: string | number | undefined): string {
  if (value === undefined || value === null) return '—';
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function truncate(text: string | undefined, max = 180): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function initials(name?: string): string {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
