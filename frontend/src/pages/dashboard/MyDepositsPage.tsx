import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, Inbox, MessageSquare, Pencil, Plus, Search } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import UploadWizard from '../../components/dashboard/UploadWizard';
import EditDepositPanel from '../../components/dashboard/EditDepositPanel';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import StatusBadge from '../../components/ui/StatusBadge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { catalogApi, itemsApi } from '../../api/services';
import { formatDate, meta, STATUS_DESCRIPTIONS, STATUS_LABELS } from '../../lib/format';
import type { Item, ItemStatus } from '../../types';

type TabValue = 'TODOS' | ItemStatus;

const TABS: Array<{ value: TabValue; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BORRADOR', label: STATUS_LABELS.BORRADOR },
  { value: 'EN_REVISION', label: STATUS_LABELS.EN_REVISION },
  { value: 'OBSERVADO', label: STATUS_LABELS.OBSERVADO },
  { value: 'PUBLICADO', label: STATUS_LABELS.PUBLICADO },
  { value: 'EMBARGADO', label: STATUS_LABELS.EMBARGADO },
];

const STATUS_ACCENTS: Record<ItemStatus, string> = {
  BORRADOR: 'bg-slate-400',
  EN_REVISION: 'bg-gold-500',
  OBSERVADO: 'bg-amber-500',
  PUBLICADO: 'bg-emerald-500',
  EMBARGADO: 'bg-purple-500',
};

export default function MyDepositsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabValue>('TODOS');
  const [query, setQuery] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [sort, setSort] = useState('recent');
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-deposits'],
    queryFn: () => itemsApi.list({ mine: true, limit: 100 }),
  });

  const items = data?.items ?? [];
  const counts = useMemo(() => {
    const result: Record<string, number> = { TODOS: items.length };
    items.forEach((item) => { result[item.status] = (result[item.status] ?? 0) + 1; });
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (tab !== 'TODOS' && item.status !== tab) return false;
      if (collectionId && item.collection?.id !== collectionId) return false;
      if (!term) return true;
      return meta(item, 'title').toLowerCase().includes(term) ||
        (item.collection?.name ?? '').toLowerCase().includes(term);
    });
    if (sort === 'title') return [...filtered].sort((a, b) => meta(a, 'title').localeCompare(meta(b, 'title')));
    if (sort === 'status') return [...filtered].sort((a, b) => a.status.localeCompare(b.status));
    return [...filtered].sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime());
  }, [items, query, tab, collectionId, sort]);

  const openDeposit = () => {
    setWizardOpen(true);
    setEditingId(null);
  };

  const handleDone = (message: string) => {
    setWizardOpen(false);
    setEditingId(null);
    notify(message, 'success');
    queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
  };

  return (
    <div className="page-shell flex flex-col gap-6 md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-5">
        <header className="card-premium relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-200/40 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Área del depositante</p>
              <h1 className="mt-2 page-title">Mis depósitos</h1>
              <p className="page-subtitle">Gestione sus documentos, corrija observaciones y siga el estado de la revisión.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <MiniStat value={counts.TODOS ?? 0} label="Depósitos" />
                <MiniStat value={(counts.EN_REVISION ?? 0) + (counts.OBSERVADO ?? 0)} label="En proceso" tone="text-gold-700" />
                <MiniStat value={counts.PUBLICADO ?? 0} label="Publicados" tone="text-emerald-700" />
              </div>
            </div>
            <button type="button" onClick={openDeposit} className="btn-primary shadow-sm">
              <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo depósito
            </button>
          </div>
        </header>

        {wizardOpen && (
          <UploadWizard
            onDone={handleDone}
            onCancel={() => setWizardOpen(false)}
          />
        )}

        {editingId && (
          <EditDepositPanel
            itemId={editingId}
            onClose={() => setEditingId(null)}
            onDone={handleDone}
          />
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filtrar depósitos por estado">
            {TABS.map((current) => {
              const active = tab === current.value;
              const count = counts[current.value] ?? 0;
              return (
                <button
                  key={current.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(current.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    active ? 'bg-unior-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-unior-950'
                  }`}
                >
                  {current.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-unior-900/5 text-ink-soft/50'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative block sm:w-56">
              <span className="sr-only">Buscar en mis depósitos</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/35" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título o colección…" className="input py-2 pl-9 text-xs" />
            </label>
            <label className="block sm:w-52">
              <span className="sr-only">Filtrar por colección</span>
              <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)} className="input py-2 text-xs">
                <option value="">Todas las colecciones</option>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
              </select>
            </label>
            <label className="block sm:w-44">
              <span className="sr-only">Ordenar depósitos</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="input py-2 text-xs">
                <option value="recent">Más recientes</option>
                <option value="title">Por título</option>
                <option value="status">Por estado</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
          </div>
        )}

        {isError && <Alert tone="error" title="No se pudieron cargar sus depósitos">Verifique la conexión e intente nuevamente.</Alert>}

        {!isLoading && !isError && visible.length === 0 && (
          items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
              title="Aún no tiene depósitos"
              description="Cargue su tesis, proyecto o trabajo académico para iniciar el proceso de revisión."
              action={<button type="button" onClick={openDeposit} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Crear mi primer depósito</button>}
            />
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6" aria-hidden="true" />}
              title="No hay depósitos con este criterio"
              description="Cambie el estado seleccionado o limpie la búsqueda para ver todos sus documentos."
              action={<button type="button" onClick={() => { setTab('TODOS'); setQuery(''); setCollectionId(''); setSort('recent'); }} className="btn-secondary">Ver todos mis depósitos</button>}
            />
          )
        )}

        {!isLoading && visible.length > 0 && (
          <div className="stagger-fade space-y-3">
            {visible.map((item) => (
              <DepositCard
                key={item.id}
                item={item}
                onEdit={() => { setEditingId(item.id); setWizardOpen(false); }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MiniStat({ value, label, tone = 'text-unior-950' }: { value: number; label: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-unior-900/10 bg-paper-50/75 px-3.5 py-2">
      <span className={`font-display text-xl font-semibold leading-none ${tone}`}>{value}</span>
      <span className="ml-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-soft/45">{label}</span>
    </div>
  );
}

function DepositCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const title = meta(item, 'title') || 'Documento sin título';
  const editable = item.status === 'BORRADOR' || item.status === 'OBSERVADO';
  const observations = item._count?.observations ?? 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5
      shadow-[0_1px_3px_rgba(6,22,47,.05),0_6px_20px_-10px_rgba(6,22,47,.1)]
      transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(6,22,47,.14)]">
      {/* Barra lateral de estado */}
      <span className={`absolute inset-y-0 left-0 w-[3px] rounded-l-2xl transition-all duration-200 group-hover:w-1 ${STATUS_ACCENTS[item.status]}`} aria-hidden="true" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-[10px] font-semibold text-ink-soft/40">
              Actualizado el {formatDate(item.updatedAt ?? item.createdAt)}
            </span>
            {observations > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <MessageSquare className="h-3 w-3" aria-hidden="true" /> {observations} observaciones
              </span>
            )}
          </div>
          <h3 className="mt-2.5 font-sans text-[15px] font-bold leading-snug text-unior-950 transition-colors duration-200 group-hover:text-unior-700">
            {title}
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft/35">
            {item.collection?.community?.name ?? 'Comunidad'} / {item.collection?.name ?? 'Colección'}
          </p>
          <p className="mt-2.5 max-w-2xl text-xs leading-5 text-ink-soft/55">{STATUS_DESCRIPTIONS[item.status]}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          <Link to={`/items/${item.id}`} className="btn-secondary px-4 py-2 text-xs">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Ver
          </Link>
          {editable && (
            <button type="button" onClick={onEdit} className="btn-primary px-4 py-2 text-xs shadow-sm">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {item.status === 'OBSERVADO' ? 'Corregir y reenviar' : 'Editar y enviar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
