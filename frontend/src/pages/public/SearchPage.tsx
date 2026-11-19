import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, FileSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { catalogApi, itemsApi, type ListParams } from '../../api/services';
import FacetFilters, { type FacetValues } from '../../components/public/FacetFilters';
import ItemCard from '../../components/public/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../api/errors';
import { meta } from '../../lib/format';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const facets: FacetValues = {
    q: params.get('q') ?? '',
    year: params.get('year') ?? '',
    communityId: params.get('communityId') ?? '',
    collectionId: params.get('collectionId') ?? '',
  };
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const [draft, setDraft] = useState(facets.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(facets.q);
  }, [facets.q]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || Boolean(target?.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeFilters = [facets.year, facets.communityId, facets.collectionId].filter(Boolean).length;

  const apply = (patch: Partial<FacetValues>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    apply({ q: draft.trim() });
  };

  const query: ListParams = Object.fromEntries(
    Object.entries({ ...facets, page }).filter(([, value]) => value !== '' && value !== undefined),
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['public-search', query],
    queryFn: () => itemsApi.list(query),
    placeholderData: (previousData) => previousData,
  });
  const { data: communities = [] } = useQuery({ queryKey: ['communities'], queryFn: catalogApi.communities });
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });
  const { data: facetData } = useQuery({ queryKey: ['public-facets'], queryFn: catalogApi.facets });

  const selectedCommunity = communities.find((community) => community.id === facets.communityId);
  const selectedCollection = collections.find((collection) => collection.id === facets.collectionId);
  const chips = [
    facets.q && { key: 'q' as const, label: `“${facets.q}”` },
    facets.year && { key: 'year' as const, label: `Año ${facets.year}` },
    selectedCommunity && { key: 'communityId' as const, label: selectedCommunity.name },
    selectedCollection && { key: 'collectionId' as const, label: selectedCollection.name },
  ].filter(Boolean) as Array<{ key: keyof FacetValues; label: string }>;

  const removeChip = (key: keyof FacetValues) => {
    if (key === 'communityId') apply({ communityId: '', collectionId: '' });
    else apply({ [key]: '' } as Partial<FacetValues>);
  };

  const clearAll = () => apply({ q: '', year: '', communityId: '', collectionId: '' });

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="page-shell">
      <div className="page-hero mb-7">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-8 right-10 h-36 w-36 rounded-full bg-unior-700/15 blur-2xl" aria-hidden="true" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_.9fr] lg:items-end">
          <div>
            <p className="eyebrow">Catálogo abierto</p>
            <h1 className="mt-2 page-title">Búsqueda de documentos</h1>
            <p className="page-subtitle">Explore tesis, proyectos y trabajos académicos del repositorio institucional.</p>
          </div>
          <form onSubmit={submitSearch} role="search">
            <label htmlFor="catalog-search" className="sr-only">Buscar documentos</label>
            <div className="flex items-center gap-1.5 rounded-2xl border border-unior-900/10 bg-white p-1.5 shadow-card transition focus-within:border-unior-400 focus-within:ring-4 focus-within:ring-unior-500/10">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" aria-hidden="true" />
                <input
                  id="catalog-search"
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') { setDraft(''); inputRef.current?.blur(); }
                  }}
                  placeholder="Título, autor o tutor…"
                  className="w-full border-0 bg-transparent py-2.5 pl-10 pr-2 text-sm font-medium text-unior-950 placeholder:text-ink-soft/35 focus:outline-none focus:ring-0"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold">
                <Search className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-ink-soft/45">
              Presione <kbd className="rounded border border-unior-900/10 bg-white px-1.5 py-0.5 font-mono text-[10px] text-unior-800">/</kbd> para enfocar la búsqueda desde cualquier parte.
            </p>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-7">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center justify-between gap-2 rounded-2xl border border-unior-900/10 bg-white px-5 py-3.5 text-sm font-bold text-unior-950 shadow-sm transition hover:border-brand-400/30 md:hidden"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden="true" /> Filtros
          </span>
          {activeFilters > 0 && <span className="badge-brand">{activeFilters}</span>}
        </button>
        <FacetFilters
          className={`${filtersOpen ? 'block' : 'hidden'} md:block`}
          values={facets}
          communities={communities}
          collections={collections}
          years={facetData?.years}
          onChange={(values) => apply({ year: values.year, communityId: values.communityId, collectionId: values.collectionId })}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft/60" aria-live="polite">
              {isLoading ? 'Buscando…' : (
                <>
                  <span className="font-display text-3xl font-bold leading-none text-unior-950">{data?.pagination.total ?? 0}</span>
                  <span className="ml-2 font-medium">{data?.pagination.total === 1 ? 'documento encontrado' : 'documentos encontrados'}</span>
                  {data && data.pagination.pages > 1 && <span className="text-ink-soft/40"> · página {data.pagination.page} de {data.pagination.pages}</span>}
                </>
              )}
              {isFetching && !isLoading && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold-300 border-t-gold-600" aria-hidden="true" /> Actualizando
                </span>
              )}
            </p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-full border border-unior-900/10 bg-white px-3 py-1.5 text-[11px] font-bold text-ink-soft/60 shadow-sm transition hover:border-red-300/60 hover:bg-red-50 hover:text-red-700">
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip.key} className="chip chip-active">
                  {chip.label}
                  <button type="button" onClick={() => removeChip(chip.key)} className="rounded-full p-0.5 transition hover:bg-unior-900/10" aria-label={`Quitar filtro ${chip.label}`}>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {isError && <Alert tone="error" title="No se pudo realizar la búsqueda">{getErrorMessage(error)}</Alert>}

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}
            </div>
          )}

          {!isLoading && data?.items.length === 0 && (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" aria-hidden="true" />}
              title="No se encontraron documentos"
              description="Pruebe con otras palabras clave o retire algunos filtros para ampliar la búsqueda."
              action={<button type="button" onClick={clearAll} className="btn-secondary">Limpiar búsqueda</button>}
            />
          )}

          {!isLoading && data && data.items.length > 0 && (
            <div className="stagger-fade grid gap-4 sm:grid-cols-2">
              {data.items.map((item) => (
                <ItemCard
                  key={item.id}
                  to={`/items/${item.id}`}
                  title={meta(item, 'title') || 'Documento sin título'}
                  author={meta(item, 'contributor', 'author')}
                  year={meta(item, 'date', 'issued')}
                  type={meta(item, 'type')}
                  community={item.collection?.community?.name}
                  collection={item.collection?.name}
                  abstract={meta(item, 'description', 'abstract')}
                />
              ))}
            </div>
          )}

          {data && data.pagination.pages > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-unior-900/10 pt-5 text-sm text-ink-soft/55" aria-label="Paginación del catálogo">
              <span className="text-xs font-bold text-unior-600">Página {data.pagination.page} de {data.pagination.pages}</span>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
                </button>
                {(() => {
                  const total = data.pagination.pages;
                  const current = data.pagination.page;
                  const items: Array<number | 'ellipsis'> = [];
                  for (let index = 1; index <= total; index += 1) {
                    if (index === 1 || index === total || Math.abs(index - current) <= 1) items.push(index);
                    else if (items[items.length - 1] !== 'ellipsis') items.push('ellipsis');
                  }
                  return items.map((entry, index) => entry === 'ellipsis' ? (
                    <span key={`e-${index}`} className="px-1 text-xs text-ink-soft/35" aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => goToPage(entry)}
                      aria-current={entry === current ? 'page' : undefined}
                      className={`h-9 min-w-[2.25rem] rounded-xl px-2 text-xs font-bold transition-all duration-200 ${
                        entry === current
                          ? 'bg-unior-950 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-ink-soft/70 hover:border-brand-400/40 hover:text-unior-950'
                      }`}
                    >
                      {entry}
                    </button>
                  ));
                })()}
                <button type="button" disabled={page >= data.pagination.pages} onClick={() => goToPage(page + 1)} className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">
                  Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
