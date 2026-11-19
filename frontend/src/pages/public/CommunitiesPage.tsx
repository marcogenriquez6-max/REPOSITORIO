import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, FolderOpen, Layers3, Plus, Search, X } from 'lucide-react';
import { catalogApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [error, setError] = useState('');
  const { data: communities = [], isLoading } = useQuery({ queryKey: ['communities'], queryFn: catalogApi.communities });
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });

  const createCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await catalogApi.createCollection({ name: name.trim(), communityId });
      setName('');
      setCommunityId('');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    } catch {
      setError('No se pudo crear la colección.');
    }
  };
  const roots = communities.filter((community) => !community.parentId);
  const totalSubcommunities = communities.filter((community) => community.parentId).length;

  return (
    <main className="page-shell">
      <div className="page-hero mb-7">
        <div className="relative grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-end">
          <div>
            <p className="eyebrow">Organización académica</p>
            <h1 className="mt-2 page-title">Comunidades y colecciones</h1>
            <p className="page-subtitle">Explore la estructura de facultades, programas y áreas del repositorio institucional.</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <SummaryStat icon={<Building2 className="h-4 w-4" />} value={roots.length} label="Comunidades" />
            <SummaryStat icon={<Layers3 className="h-4 w-4" />} value={totalSubcommunities} label="Subcomunidades" />
            <SummaryStat icon={<FolderOpen className="h-4 w-4" />} value={collections.length} label="Colecciones" />
          </div>
          {user?.role === 'ADMIN' && (
            <button type="button" onClick={() => setModalOpen(true)} className="btn-primary mt-2 inline-flex w-fit items-center gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" /> Nueva colección
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="card space-y-4 p-6">
              <Skeleton className="h-6 w-1/3" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && roots.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay comunidades registradas"
          description="La estructura académica del repositorio se mostrará aquí cuando esté configurada."
        />
      )}

      <div className="space-y-5">
        {roots.map((community) => {
          const children = communities.filter((child) => child.parentId === community.id);
          const communityCollections = collections.filter((collection) =>
            collection.communityId === community.id || children.some((child) => child.id === collection.communityId),
          );

          return (
            <section key={community.id} className="card overflow-hidden">
              <div className="surface-hero relative overflow-hidden px-5 py-6 text-white sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-brand-300 backdrop-blur-sm">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl font-semibold leading-tight text-white">{community.name}</h2>
                      <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-unior-200/60">
                        {community._count?.children ?? children.length} subcomunidades · {community._count?.collections ?? collections.filter((collection) => collection.communityId === community.id).length} colecciones directas
                      </p>
                      {community.shortDescription && <p className="mt-2 max-w-2xl text-sm leading-6 text-unior-100/65">{community.shortDescription}</p>}
                    </div>
                  </div>
                  <Link to={`/search?communityId=${community.id}`} className="btn border border-white/15 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-sm hover:bg-white/20">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" /> Buscar aquí
                  </Link>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-3">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-soft/45">Subcomunidades</h3>
                  {children.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/search?communityId=${child.id}`}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-unior-900/10 bg-paper-50/70 px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-400/40 hover:bg-white hover:shadow-sm hover:text-unior-950"
                          >
                            <span className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-200/50 text-brand-600">
                                <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                              {child.name}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft/30 transition group-hover:translate-x-0.5 group-hover:text-unior-900" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-soft/50">Sin subcomunidades.</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-soft/45">Colecciones</h3>
                  {communityCollections.length > 0 ? (
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {communityCollections.map((collection) => {
                        const owner = communities.find((candidate) => candidate.id === collection.communityId);
                        return (
                          <Link
                            key={collection.id}
                            to={`/search?collectionId=${collection.id}`}
                            className="group flex items-start gap-3 rounded-xl border border-unior-900/10 bg-white/60 p-3.5 transition hover:border-brand-400/40 hover:bg-white hover:shadow-card hover:-translate-y-0.5"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-300/20 text-brand-600">
                              <FolderOpen className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-unior-950 group-hover:text-unior-700">{collection.name}</span>
                              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft/40">
                                {owner?.id === community.id ? 'Colección directa' : `En ${owner?.name ?? 'subcomunidad'}`}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-ink-soft/50">Sin colecciones registradas.</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-unior-950/50 p-4">
          <form onSubmit={createCollection} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-unior-950">Nueva colección</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-slate-700">
              Nombre
              <input value={name} onChange={(event) => setName(event.target.value)} required className="input mt-2" placeholder="Nombre de la colección" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Comunidad
              <select value={communityId} onChange={(event) => setCommunityId(event.target.value)} required className="input mt-2">
                <option value="">Seleccione una comunidad…</option>
                {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
              </select>
            </label>
            {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Crear colección</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function SummaryStat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm transition hover:border-brand-400/30 hover:bg-white hover:shadow-card">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-200/60 text-brand-600">{icon}</span>
      <p className="mt-2.5 font-display text-2xl font-semibold leading-none text-unior-950">{value}</p>
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-soft/45">{label}</p>
    </div>
  );
}
