import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FilterX,
  Inbox,
  MessageSquare,
  UserRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { catalogApi, reviewApi, type ListParams } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/errors';
import { formatDate, meta } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import type { Item, ItemStatus } from '../../types';

const defaultFilters = {
  q: '',
  author: '',
  status: '',
  communityId: '',
  collectionId: '',
  year: '',
  from: '',
  to: '',
  page: 1,
  limit: 10,
  assignedToMe: false,
};

export default function ReviewInboxPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const debouncedQ = useDebouncedValue(filters.q);
  const debouncedAuthor = useDebouncedValue(filters.author);

  const params: ListParams = Object.fromEntries(
    Object.entries({ ...filters, q: debouncedQ, author: debouncedAuthor })
      .filter(([, value]) => value !== '' && value !== undefined && value !== false)
      .map(([key, value]) => [key, value as string | number | boolean]),
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['review-inbox', params],
    queryFn: () => reviewApi.inbox(params),
  });
  const { data: communities = [] } = useQuery({ queryKey: ['communities'], queryFn: catalogApi.communities });
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });

  const visibleCollections = useMemo(
    () => filters.communityId ? collections.filter((collection) => collection.communityId === filters.communityId) : collections,
    [collections, filters.communityId],
  );

  const set = (patch: Partial<typeof filters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));
  const reset = () => setFilters(defaultFilters);
  const activeFilters = [filters.q, filters.author, filters.status, filters.communityId, filters.collectionId, filters.year, filters.from, filters.to, filters.assignedToMe ? 'assigned' : '']
    .filter(Boolean).length;

  return (
    <div className="page-shell flex flex-col gap-6 md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-5">
        <header className="card-premium relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-200/35 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Comité académico</p>
              <h1 className="mt-2 page-title">Bandeja de revisión</h1>
              <p className="page-subtitle">Documentos pendientes de evaluación, corrección y aprobación.</p>
            </div>
            <span className="chip">
              <Clock3 className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              {isFetching && !isLoading ? 'Actualizando…' : `${data?.pagination.total ?? 0} documentos`}
            </span>
          </div>
        </header>

        {data?.indicators && (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
            <Indicator icon={Clock3} title="En revisión" value={data.indicators.byStatus.EN_REVISION ?? 0} tone="text-unior-700" />
            <Indicator icon={AlertTriangle} title="Observados" value={data.indicators.byStatus.OBSERVADO ?? 0} tone="text-amber-700" />
            <Indicator icon={MessageSquare} title="Obs. pendientes" value={data.indicators.pendingObservations} tone="text-amber-700" />
            <Indicator icon={CheckCircle2} title="Aprobados" value={data.indicators.approved} tone="text-emerald-700" />
            <Indicator icon={XCircle} title="Rechazados" value={data.indicators.rejected} tone="text-red-700" />
            <Indicator icon={Inbox} title="En bandeja" value={data.pagination.total} tone="text-unior-700" />
          </div>
        )}

        <form onSubmit={(event) => event.preventDefault()} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-unior-900/10 bg-paper-50/60 px-5 py-4">
            <h2 className="section-title">Filtros de la bandeja</h2>
            <div className="flex items-center gap-3">
              {activeFilters > 0 && <span className="badge-brand">{activeFilters} activos</span>}
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-soft/50 transition hover:text-unior-900">
                <FilterX className="h-3.5 w-3.5" aria-hidden="true" /> Limpiar
              </button>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Título">
              <input className="input" value={filters.q} onChange={(event) => set({ q: event.target.value })} placeholder="Buscar por título" />
            </Field>
            <Field label="Autor">
              <input className="input" value={filters.author} onChange={(event) => set({ author: event.target.value })} placeholder="Buscar por autor" />
            </Field>
            <Field label="Comunidad / Programa">
              <select className="input" value={filters.communityId} onChange={(event) => set({ communityId: event.target.value, collectionId: '' })}>
                <option value="">Todas</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>{community.parentId ? '· ' : ''}{community.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Colección / Área">
              <select className="input" value={filters.collectionId} onChange={(event) => set({ collectionId: event.target.value })}>
                <option value="">Todas</option>
                {visibleCollections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
              </select>
            </Field>
            <Field label="Año">
              <input className="input" value={filters.year} onChange={(event) => set({ year: event.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="AAAA" inputMode="numeric" />
            </Field>
            <Field label="Recibido desde">
              <input type="date" className="input" value={filters.from} onChange={(event) => set({ from: event.target.value })} />
            </Field>
            <Field label="Recibido hasta">
              <input type="date" className="input" value={filters.to} onChange={(event) => set({ to: event.target.value })} />
            </Field>
            <Field label="Estado">
              <select className="input" value={filters.status} onChange={(event) => set({ status: event.target.value })}>
                <option value="">Pendientes (por defecto)</option>
                <option value="EN_REVISION">En revisión</option>
                <option value="OBSERVADO">Observados</option>
                {user?.role === 'ADMIN' && <option value="BORRADOR">Borradores</option>}
                <option value="PUBLICADO">Publicados</option>
                <option value="EMBARGADO">Embargados</option>
              </select>
            </Field>
          </div>
          <label className="mx-5 mb-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-unior-900/10 bg-paper-50/70 px-3 py-2 text-xs font-semibold text-ink-soft/60">
            <input type="checkbox" checked={filters.assignedToMe} onChange={(event) => set({ assignedToMe: event.target.checked })} className="h-4 w-4 rounded border-ink-soft/20" />
            Ver solo los asignados a mí
          </label>
        </form>

        {isError && <Alert tone="error" title="No se pudo cargar la bandeja">{getErrorMessage(error)}</Alert>}
        {isLoading && <TableSkeleton rows={5} />}

        {!isLoading && data && data.items.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" aria-hidden="true" />}
            title="No hay documentos en la bandeja"
            description="No existen documentos que coincidan con los filtros. Pruebe limpiar los filtros o revisar otros estados."
            action={<button type="button" onClick={reset} className="btn-secondary">Limpiar filtros</button>}
          />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-unior">
                  <thead>
                    <tr>
                      <th className="th-unior">Documento</th>
                      <th className="th-unior">Autor</th>
                      <th className="th-unior">Programa / Área</th>
                      <th className="th-unior">Recepción</th>
                      <th className="th-unior">Responsable</th>
                      <th className="th-unior">Estado</th>
                      <th className="th-unior"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => <Row key={item.id} item={item} />)}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft/50">
              <span>Página {data.pagination.page} de {data.pagination.pages || 1} · {data.pagination.total} documentos</span>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="btn-secondary px-4 py-2 text-xs">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
                </button>
                <button disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="btn-secondary px-4 py-2 text-xs">
                  Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span><div className="mt-2">{children}</div></label>;
}

function Indicator({ icon: Icon, title, value, tone }: { icon: LucideIcon; title: string; value: number; tone: string }) {
  return (
    <div className="stat-card p-4 group cursor-default">
      <div className="relative flex items-start justify-between gap-2">
        <div className={`font-display text-2xl font-semibold leading-none tracking-tight ${tone}`}>{value}</div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${tone}`}
          style={{ background: 'rgba(currentcolor, 0.08)' }}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-current/10`}>
            <Icon className="h-4 w-4 opacity-80" aria-hidden="true" />
          </span>
        </span>
      </div>
      <div className="stat-label mt-2.5">{title}</div>
    </div>
  );
}

function Row({ item }: { item: Item }) {
  const title = meta(item, 'title') || 'Sin título';
  const author = meta(item, 'contributor', 'author') || '—';
  const observations = item._count?.observations ?? 0;
  return (
    <tr className="group transition-colors hover:bg-brand-300/[0.05]">
      <td className="td-unior max-w-xs font-bold text-unior-950">
        <Link to={`/dashboard/review/${item.id}`} className="line-clamp-2 transition hover:text-brand-600">{title}</Link>
      </td>
      <td className="td-unior text-xs">{author}</td>
      <td className="td-unior text-xs">{item.collection?.community?.name ?? '—'} / {item.collection?.name ?? '—'}</td>
      <td className="td-unior whitespace-nowrap text-xs">{formatDate(item.submittedAt)}</td>
      <td className="td-unior text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-3 w-3 text-ink-soft/40" aria-hidden="true" />
          </span>
          {item.assignedReviewer?.fullName ?? 'Sin asignar'}
        </span>
      </td>
      <td className="td-unior">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={item.status as ItemStatus} />
          {observations > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700" title={`${observations} observaciones`}>
              <MessageSquare className="h-3 w-3" aria-hidden="true" /> {observations}
            </span>
          )}
        </div>
      </td>
      <td className="td-unior">
        <Link to={`/dashboard/review/${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-unior-950 px-3.5 py-1.5 text-[10px] font-bold text-white
            shadow-sm transition-all duration-200 hover:bg-brand-500 hover:shadow-brand-sm group-hover:shadow-sm">
          Evaluar <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}
