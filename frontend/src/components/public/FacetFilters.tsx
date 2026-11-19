import { FilterX, SlidersHorizontal } from 'lucide-react';
import type { Collection, Community, FacetYear } from '../../types';

export interface FacetValues {
  q: string;
  year: string;
  communityId: string;
  collectionId: string;
}

interface Props {
  values: FacetValues;
  communities: Community[];
  collections: Collection[];
  years?: FacetYear[];
  onChange: (values: FacetValues) => void;
  className?: string;
}

export default function FacetFilters({ values, communities, collections, years = [], onChange, className = '' }: Props) {
  const roots = communities.filter((community) => !community.parentId);
  const children = communities.filter((community) => community.parentId);
  const visibleCollections = values.communityId
    ? collections.filter((collection) => collection.communityId === values.communityId)
    : collections;
  const activeCount = [values.year, values.communityId, values.collectionId].filter(Boolean).length;

  const set = (patch: Partial<FacetValues>) => onChange({ ...values, ...patch });
  const clear = () => onChange({ q: values.q, year: '', communityId: '', collectionId: '' });

  return (
    <aside className={`w-full md:sticky md:top-24 md:w-72 md:self-start ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-unior-900/10 bg-white/90 shadow-card backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-unior-900/10 bg-paper-50/80 px-5 py-4">
          <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-unior-950">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-200/60 text-brand-600">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Filtros
            {activeCount > 0 && <span className="badge-brand">{activeCount}</span>}
          </h2>
          {activeCount > 0 && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded-full border border-unior-900/10 bg-white px-2.5 py-1 text-[11px] font-bold text-ink-soft/55 transition hover:border-brand-400/30 hover:text-unior-900">
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" /> Limpiar
            </button>
          )}
        </div>

        <div className="space-y-5 p-5">
          <label className="block text-sm">
            <span className="label">Año de publicación</span>
            {years.length > 0 ? (
              <select value={values.year} onChange={(event) => set({ year: event.target.value })} className="input mt-2">
                <option value="">Todos los años</option>
                {years.map((year) => (
                  <option key={year.year} value={year.year}>{year.year} ({year.count})</option>
                ))}
              </select>
            ) : (
              <input
                value={values.year}
                onChange={(event) => set({ year: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="Ej. 2026"
                inputMode="numeric"
                className="input mt-2"
              />
            )}
          </label>

          <label className="block text-sm">
            <span className="label">Comunidad / Programa</span>
            <select
              value={values.communityId}
              onChange={(event) => set({ communityId: event.target.value, collectionId: '' })}
              className="input mt-2"
            >
              <option value="">Todas</option>
              {roots.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
              {children.map((community) => <option key={community.id} value={community.id}>· {community.name}</option>)}
            </select>
          </label>

          <label className="block text-sm">
            <span className="label">Colección / Área</span>
            <select
              value={values.collectionId}
              onChange={(event) => set({ collectionId: event.target.value })}
              className="input mt-2"
            >
              <option value="">Todas</option>
              {visibleCollections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
            {values.communityId && visibleCollections.length === 0 && (
              <span className="field-hint">Esta comunidad todavía no tiene colecciones.</span>
            )}
          </label>
        </div>

        <div className="border-t border-unior-900/10 bg-paper-100/60 px-5 py-3.5 text-[11px] leading-5 text-ink-soft/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
            Combine filtros para acotar la búsqueda.
          </span>
        </div>
      </div>
    </aside>
  );
}
