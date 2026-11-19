import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ClipboardCheck, Download, FileText, Users, type LucideIcon } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { adminApi, itemsApi, catalogApi, usersApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import { useToast } from '../../components/ui/Toast';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatDate, itemTitle, ROLE_LABELS, STATUS_LABELS } from '../../lib/format';
import type { Item, ItemStatus, User } from '../../types';

const reviewableStatuses: ItemStatus[] = ['EN_REVISION', 'OBSERVADO'];

const ROLE_BADGES: Record<User['role'], string> = {
  ADMIN: 'badge-navy',
  REVISOR: 'badge-blue',
  DEPOSITANTE: 'badge-slate',
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [itemId, setItemId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionCommunity, setNewCollectionCommunity] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('DEPOSITANTE');
  const [newUserPassword, setNewUserPassword] = useState('');
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });
  const { data: communities = [] } = useQuery({ queryKey: ['communities'], queryFn: catalogApi.communities });
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.users });
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['admin-items'],
    queryFn: () => itemsApi.list({ limit: 100 }),
  });

  const assign = useMutation({
    mutationFn: () => adminApi.assignReviewer(itemId, reviewerId),
    onSuccess: () => {
      notify('Revisor asignado correctamente. Ya puede acceder al documento desde su bandeja.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-items'] });
      queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
    },
    onError: (error) => notify(getErrorMessage(error, 'No se pudo asignar el revisor'), 'error'),
  });

  const createCollection = useMutation({
    mutationFn: () => catalogApi.createCollection({ name: newCollectionName.trim(), communityId: newCollectionCommunity }),
    onSuccess: () => {
      notify('Colección creada correctamente.', 'success');
      setNewCollectionName('');
      setNewCollectionCommunity('');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error) => notify(getErrorMessage(error, 'No se pudo crear la colección'), 'error'),
  });

  const createUser = useMutation({
    mutationFn: () => usersApi.create({ email: newUserEmail.trim(), fullName: newUserFullName.trim(), role: newUserRole, password: newUserPassword }),
    onSuccess: () => {
      notify('Usuario creado correctamente.', 'success');
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => notify(getErrorMessage(error, 'No se pudo crear el usuario'), 'error'),
  });

  const users = usersData?.users ?? [];
  const reviewers = users.filter((user) => user.role === 'REVISOR' || user.role === 'ADMIN');
  const reviewableItems = useMemo(
    () => (itemsData?.items ?? []).filter((item) => reviewableStatuses.includes(item.status)),
    [itemsData]
  );
  const selectedItem = reviewableItems.find((item) => item.id === itemId);

  const count = (status: ItemStatus) => Number(stats?.byStatus[status] ?? 0);
  const total = Object.values(stats?.byStatus ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0);

  const selectItem = (nextId: string) => {
    setItemId(nextId);
    const item = reviewableItems.find((entry) => entry.id === nextId);
    setReviewerId(item?.assignedReviewer?.id ?? '');
  };

  return (
    <div className="page-shell flex flex-col gap-6 md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-5">
        <header className="card-premium relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-200/35 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Control institucional</p>
              <h1 className="mt-2 page-title">Administración</h1>
              <p className="page-subtitle">Supervise la operación del repositorio y asigne responsables de revisión.</p>
            </div>
            <Link to="/dashboard/review" className="link-arrow">
              Ir a la bandeja <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {statsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => <div key={key} className="stat-card h-28 animate-pulse bg-white/40" />)}
          </div>
        ) : (
          <div className="stagger-fade grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={FileText} label="Documentos" value={total} hint={`${count('BORRADOR')} en borrador`} />
            <MetricCard icon={ClipboardCheck} label="Publicados" value={count('PUBLICADO') + count('EMBARGADO')} hint={`${count('EN_REVISION')} en revisión`} />
            <MetricCard icon={Users} label="Usuarios activos" value={Number(stats?.activeUsers ?? 0)} hint={`${reviewers.length} revisores`} />
            <MetricCard icon={Download} label="Descargas" value={Number(stats?.totalDownloads ?? 0)} hint={`${stats?.pendingObservations ?? 0} observaciones pendientes`} />
          </div>
        )}

        <section className="card card-body">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="eyebrow">Asignación</p>
              <h2 className="mt-1.5 section-title">Responsable de revisión</h2>
              <p className="mt-1 text-xs leading-5 text-ink-soft/55">Seleccione un documento en revisión y el revisor que lo atenderá.</p>
            </div>
            <span className="chip">{reviewableItems.length} pendientes</span>
          </div>

          {itemsLoading ? (
            <TableSkeleton rows={2} />
          ) : reviewableItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-unior-900/15 bg-paper-50/60 p-5 text-sm text-ink-soft/55">
              No hay documentos pendientes de asignación en este momento.
            </p>
          ) : (
            <>
              <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
                <label className="block">
                  <span className="label">Documento</span>
                  <select value={itemId} onChange={(event) => selectItem(event.target.value)} className="input mt-2">
                    <option value="">Seleccione un documento…</option>
                    {reviewableItems.map((item) => <ItemOption key={item.id} item={item} />)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Revisor</span>
                  <select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} className="input mt-2">
                    <option value="">Seleccione un revisor…</option>
                    {reviewers.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName} · {ROLE_LABELS[user.role]}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => assign.mutate()}
                  disabled={!itemId || !reviewerId || assign.isPending}
                  className="btn-primary"
                >
                  {assign.isPending ? 'Asignando…' : 'Asignar revisor'}
                </button>
              </div>

              {selectedItem && (
                <div className="mt-4 rounded-2xl border border-brand-500/20 bg-brand-300/10 px-4 py-3 text-xs leading-5 text-ink-soft/65">
                  <span className="font-bold text-unior-950">{itemTitle(selectedItem)}</span>
                  <span className="mx-1.5 text-unior-900/20">·</span>{STATUS_LABELS[selectedItem.status]}
                  <span className="mx-1.5 text-unior-900/20">·</span>Asignado actualmente: {selectedItem.assignedReviewer?.fullName ?? 'sin asignar'}
                </div>
              )}
            </>
          )}

        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <form className="card card-body space-y-4" onSubmit={(event) => { event.preventDefault(); createUser.mutate(); }}>
            <div>
              <p className="eyebrow">Altas</p>
              <h2 className="mt-1.5 section-title">Nuevo usuario</h2>
              <p className="mt-1 text-xs leading-5 text-ink-soft/55">Registre una cuenta para el repositorio.</p>
            </div>
            <label className="block">
              <span className="label">Nombre completo</span>
              <input value={newUserFullName} onChange={(event) => setNewUserFullName(event.target.value)} required className="input mt-2" placeholder="Nombre y apellidos" />
            </label>
            <label className="block">
              <span className="label">Correo electrónico</span>
              <input type="email" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} required className="input mt-2" placeholder="correo@unior.edu.bo" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Rol</span>
                <select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value)} className="input mt-2">
                  <option value="DEPOSITANTE">Depositante</option>
                  <option value="REVISOR">Revisor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Contraseña</span>
                <input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} required minLength={8} className="input mt-2" placeholder="Mínimo 8 caracteres" />
              </label>
            </div>
            <button type="submit" disabled={createUser.isPending} className="btn-primary">
              {createUser.isPending ? 'Creando…' : 'Crear usuario'}
            </button>
          </form>

          <form className="card card-body space-y-4" onSubmit={(event) => { event.preventDefault(); createCollection.mutate(); }}>
            <div>
              <p className="eyebrow">Organización</p>
              <h2 className="mt-1.5 section-title">Nueva colección</h2>
              <p className="mt-1 text-xs leading-5 text-ink-soft/55">Cree una colección dentro de una comunidad.</p>
            </div>
            <label className="block">
              <span className="label">Nombre de la colección</span>
              <input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} required className="input mt-2" placeholder="Ej. Ingeniería de Sistemas" />
            </label>
            <label className="block">
              <span className="label">Comunidad</span>
              <select value={newCollectionCommunity} onChange={(event) => setNewCollectionCommunity(event.target.value)} required className="input mt-2">
                <option value="">Seleccione una comunidad…</option>
                {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
              </select>
            </label>
            <button type="submit" disabled={createCollection.isPending} className="btn-primary">
              {createCollection.isPending ? 'Creando…' : 'Crear colección'}
            </button>
          </form>
        </section>

        <section className="card card-body">
          <div>
            <p className="eyebrow">Uso del repositorio</p>
            <h2 className="mt-1.5 section-title">Documentos más consultados</h2>
            <p className="mt-1 text-xs leading-5 text-ink-soft/55">Ranking de visualizaciones y descargas.</p>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-soft/45">Más visualizados</h3>
              {(stats?.topViewed ?? []).length === 0 ? <p className="text-sm text-ink-soft/50">Sin datos.</p> : (
                <ul className="space-y-2">
                  {stats?.topViewed.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-unior-900/10 bg-paper-50/60 px-3 py-2 text-xs">
                      <Link to={`/items/${entry.id}`} className="min-w-0 truncate font-semibold text-unior-950 hover:text-unior-700">{entry.title}</Link>
                      <span className="shrink-0 font-bold text-unior-700">{entry.views} vistas</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-soft/45">Más descargados</h3>
              {(stats?.topDownloaded ?? []).length === 0 ? <p className="text-sm text-ink-soft/50">Sin datos.</p> : (
                <ul className="space-y-2">
                  {stats?.topDownloaded.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-unior-900/10 bg-paper-50/60 px-3 py-2 text-xs">
                      <Link to={`/items/${entry.id}`} className="min-w-0 truncate font-semibold text-unior-950 hover:text-unior-700">{entry.title}</Link>
                      <span className="shrink-0 font-bold text-unior-700">{entry.downloads} descargas</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-unior-900/10 bg-paper-50/60 px-5 py-4">
            <div>
              <h2 className="section-title">Usuarios del sistema</h2>
              <p className="mt-0.5 text-[11px] text-ink-soft/45">{users.length} cuentas registradas</p>
            </div>
            <span className="chip"><Users className="h-3.5 w-3.5" aria-hidden="true" /> {reviewers.length} revisores</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr>
                  <th className="th-unior">Usuario</th>
                  <th className="th-unior">Correo</th>
                  <th className="th-unior">Rol</th>
                  <th className="th-unior">Estado</th>
                  <th className="th-unior">Último acceso</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading && <tr><td colSpan={5} className="p-4"><TableSkeleton rows={3} /></td></tr>}
                {!usersLoading && users.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-ink-soft/50">No hay usuarios registrados.</td></tr>
                )}
                {users.map((user) => <UserRow key={user.id} user={user} />)}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: number; hint: string }) {
  return (
    <div className="stat-card p-5">
      <div className="relative flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-unior-800 to-unior-950 text-brand-300 shadow-sm">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="stat-value mt-2">{value.toLocaleString('es')}</div>
      <p className="mt-1 text-[10px] font-semibold text-ink-soft/40">{hint}</p>
    </div>
  );
}

function ItemOption({ item }: { item: Item }) {
  return <option value={item.id}>{itemTitle(item)} · {STATUS_LABELS[item.status]}</option>;
}

function UserRow({ user }: { user: User }) {
  return (
    <tr className="border-t border-unior-900/[0.06] transition-colors duration-150 hover:bg-brand-200/[0.08]">
      <td className="td-unior font-bold text-unior-950">{user.fullName}</td>
      <td className="td-unior text-xs text-ink-soft/70">{user.email}</td>
      <td className="td-unior"><span className={ROLE_BADGES[user.role]}>{ROLE_LABELS[user.role]}</span></td>
      <td className="td-unior">
        <span className={`${user.isActive ? 'badge-green' : 'badge-slate'} inline-flex items-center gap-1`}>
          <span className={`h-1 w-1 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="td-unior text-xs text-ink-soft/55">{user.lastLoginAt ? formatDate(user.lastLoginAt, true) : 'Nunca'}</td>
    </tr>
  );
}
