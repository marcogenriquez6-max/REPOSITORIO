import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, FolderOpen, Layers3, Plus, Search } from 'lucide-react';
import { catalogApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: communities = [], isLoading: isLoadingCommunities } = useQuery({ queryKey: ['communities'], queryFn: catalogApi.communities });
  const { data: collections = [], isLoading: isLoadingCollections } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });

  const isLoading = isLoadingCommunities || isLoadingCollections;

  const closeModal = () => {
    setModalOpen(false);
    setError('');
  };

  const createCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !communityId) {
      setError('Ingrese un nombre y seleccione una comunidad.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await catalogApi.createCollection({ name: trimmedName, communityId });
      setName('');
      setCommunityId('');
      closeModal();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
        queryClient.invalidateQueries({ queryKey: ['public-facets'] }),
      ]);
    } catch (cause) {
      setError(getErrorMessage(cause, 'No se pudo crear la colección.'));
    } finally {
      setSaving(false);
    }
  };

  const roots = communities.filter((community) => !community.parentId);
  const totalSubcommunities = communities.filter((community) => community.parentId).length;

  return (
    <main className="page-shell">
      <div className="page-hero mb-7">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Organización académica</p>
            <h1 className="mt-2 page-title">Comunidades y colecciones</h1>
            <p className="page-subtitle">Explore la estructura de facultades, programas y áreas del repositorio institucional.</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <SummaryStat icon={<Building2 className="h-4 w-4" />} value={roots.length} label="Comunidades" />
              <SummaryStat icon={<Layers3 className="h-4 w-4" />} value={totalSubcommunities} label="Subcomunidades" />
              <SummaryStat icon={<FolderOpen className="h-4 w-4" />} value={collections.length} label="Colecciones" />
            </div>
            {user?.role === 'ADMIN' && (
              <button type="button" onClick={() => setModalOpen(true)} className="btn-brand w-full sm:w-auto">
                <Plus className="h-4 w-4" aria-hidden="true" /> Nueva colección
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando organización académica">
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
        {!isLoading && roots.map((community) => {
          const children = communities.filter((child) => child.parentId === community.id);
          const communityCollections = collections.filter((collection) =>
            collection.communityId === community.id || children.some((child) => child.id === collection.communityId),
          );
          const directCollections = collections.filter((collection) => collection.communityId === community.id);

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
                      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-unior-100">
                        {community._count?.children ?? children.length} subcomunidades · {community._count?.collections ?? directCollections.length} colecciones directas
                      </p>
                      {community.shortDescription && <p className="mt-2 max-w-2xl text-sm leading-6 text-unior-50">{community.shortDescription}</p>}
                    </div>
                  </div>
                  <Link to={`/search?communityId=${community.id}`} className="btn border border-white/20 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-sm hover:bg-white/20">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" /> Buscar aquí
                  </Link>
                </div>
              </div>

              <div className={`grid gap-6 p-5 sm:p-7 ${children.length > 0 ? 'lg:grid-cols-3' : ''}`}>
                <div>
                  <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">Subcomunidades</h3>
                  {children.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/search?communityId=${child.id}`}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-unior-900/10 bg-paper-50/70 px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-400/40 hover:bg-white hover:shadow-sm hover:text-unior-950"
                          >
                            <span className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                                <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                              {child.name}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-unior-900" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-soft">Sin subcomunidades registradas.</p>
                  )}
                </div>

                <div className={children.length > 0 ? 'lg:col-span-2' : ''}>
                  <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">Colecciones</h3>
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
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                              <FolderOpen className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-unior-950 group-hover:text-unior-700">{collection.name}</span>
                              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                                {owner?.id === community.id ? 'Colección directa' : `En ${owner?.name ?? 'subcomunidad'}`}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-ink-soft">Sin colecciones registradas.</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Modal open={modalOpen} title="Nueva colección" subtitle="La colección quedará asociada a la comunidad seleccionada." onClose={closeModal}>
        <form onSubmit={createCollection} className="space-y-4">
          <label className="block text-xs font-semibold text-ink-soft">
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} required className="input mt-2" placeholder="Nombre de la colección" aria-invalid={Boolean(error)} />
          </label>
          <label className="block text-xs font-semibold text-ink-soft">
            Comunidad
            <select value={communityId} onChange={(event) => setCommunityId(event.target.value)} required className="input mt-2" aria-invalid={Boolean(error)}>
              <option value="">Seleccione una comunidad…</option>
              {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
            </select>
          </label>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-brand" disabled={saving}>{saving ? 'Creando…' : 'Crear colección'}</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

function SummaryStat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-unior-900/10 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm transition hover:border-brand-400/30 hover:bg-white hover:shadow-card">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700">{icon}</span>
      <p className="mt-2.5 font-display text-2xl font-semibold leading-none text-unior-950">{value}</p>
      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
    </div>
  );
}
