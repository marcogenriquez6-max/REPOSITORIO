import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Download,
  FileCheck2,
  FolderOpen,
  Search,
  ShieldCheck,
} from 'lucide-react';
import SearchBar from '../../components/public/SearchBar';
import ItemCard from '../../components/public/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { catalogApi, itemsApi } from '../../api/services';
import { meta } from '../../lib/format';

const STEPS = [
  { icon: Search, title: 'Explora', text: 'Busque por título, autor, año o comunidad académica.' },
  { icon: Building2, title: 'Gestión universitaria', text: 'UNIOR incorpora y organiza su producción académica.' },
  { icon: FileCheck2, title: 'Acceso abierto', text: 'Consulte los documentos aprobados y disponibles en el catálogo.' },
];

export default function HomePage() {
  const { data: stats } = useQuery({ queryKey: ['public-stats'], queryFn: catalogApi.stats });
  const { data: facets } = useQuery({ queryKey: ['public-facets'], queryFn: catalogApi.facets });
  const { data: latest, isLoading: loadingLatest } = useQuery({
    queryKey: ['latest-items'],
    queryFn: () => itemsApi.list({ limit: 6, status: 'PUBLICADO' }),
  });

  const published = stats?.byStatus.PUBLICADO ?? 0;
  const communities = facets?.communities.filter((community) => !community.parentId) ?? [];
  const collections = facets?.collections ?? [];
  return (
    <main className="overflow-hidden">
      <section className="page-shell-wide pb-0">
        <div className="home-hero px-5 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
          <div className="halo-brand -left-28 top-4 h-80 w-80 opacity-80" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 z-0 opacity-60 [background-image:radial-gradient(rgba(6,22,47,.05)_0.6px,transparent_0.6px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_55%_at_18%_20%,black,transparent_75%)]" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="animate-fade-up lg:col-span-7">
              <span className="hero-eyebrow">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                </span>
                Repositorio institucional · UNIOR
              </span>
              <h1 className="mt-5 max-w-4xl font-display text-[2.9rem] font-semibold leading-[0.98] tracking-tight text-unior-950 sm:text-[3.9rem] lg:text-[5rem]">
                La memoria académica de UNIOR, <em className="text-gradient-brand not-italic">abierta</em> al mundo.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 sm:text-[17px] sm:leading-8">
                Explore tesis, proyectos y trabajos académicos en un archivo digital organizado para preservar el conocimiento y hacerlo accesible.
              </p>

              <div className="mt-8 max-w-3xl">
                <SearchBar />
                <p className="mt-3 text-left text-xs font-medium text-slate-400">
                  Presione Enter o use el botón para buscar por título, autor o tutor.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> Acceso abierto</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> Revisión por comité</span>
                <span className="inline-flex items-center gap-1.5"><FolderOpen className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> Metadatos Dublin Core</span>
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:140ms] lg:col-span-5">
              <div className="hero-glass relative overflow-hidden p-5 sm:p-6 shadow-lift">
                <figure className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src="/unior-campus.webp"
                    alt="Edificio de la Universidad Privada de Oruro"
                    className="aspect-[16/9] w-full object-cover object-center"
                    loading="eager"
                    decoding="async"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-unior-950/95 via-unior-950/50 to-transparent px-4 pb-3 pt-12">
                    <span className="text-sm font-bold text-white">Edificio de UNIOR</span>
                    <span className="text-xs font-medium text-white/70">Oruro, Bolivia</span>
                  </figcaption>
                </figure>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Repositorio UNIOR</p>
                    <p className="mt-1.5 font-display text-2xl font-semibold text-unior-950">Conocimiento que permanece</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/35 bg-gold-100/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-unior-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" aria-hidden="true" /> Catálogo UNIOR
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <HeroMetric icon={<FileCheck2 className="h-4 w-4" />} value={published} label="Publicados" />
                  <HeroMetric icon={<Building2 className="h-4 w-4" />} value={communities.length} label="Comunidades" />
                  <HeroMetric icon={<FolderOpen className="h-4 w-4" />} value={collections.length} label="Colecciones" />
                  <HeroMetric icon={<Download className="h-4 w-4" />} value={stats?.totalDownloads ?? 0} label="Descargas" />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gold-400/25 bg-gold-100/45 px-4 py-3.5">
                  <div>
                    <p className="text-xs font-bold text-unior-950">Preservación digital</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">Metadatos normalizados y acceso permanente.</p>
                  </div>
                  <Link to="/communities" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400 text-unior-950 shadow-gold-sm transition hover:bg-gold-300 hover:shadow-gold" aria-label="Explorar comunidades">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Descubra</p>
            <h2 className="mt-2 page-title">Últimas publicaciones</h2>
            <p className="page-subtitle">Documentos aprobados y disponibles para consulta y descarga.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
              {latest && latest.pagination.total > 0
                ? `${latest.pagination.total} ${plural(latest.pagination.total, 'documento publicado', 'documentos publicados')}`
                : 'Catálogo en preparación'}
            </span>
            <Link to="/search" className="btn-secondary">
              Ver todo el catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {loadingLatest ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
          </div>
        ) : latest && latest.items.length > 0 ? (
          <div className="stagger-fade grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.items.map((item) => (
              <ItemCard
                key={item.id}
                to={`/items/${item.id}`}
                title={meta(item, 'title') || 'Documento sin título'}
                author={meta(item, 'contributor', 'author')}
                year={meta(item, 'date', 'issued')}
                type={meta(item, 'type')}
                community={item.collection?.community?.name}
                collection={item.collection?.name}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title="El catálogo está tomando forma"
            description="La Universidad Privada de Oruro incorpora y organiza sus documentos para que la comunidad pueda consultarlos aquí."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/search" className="btn-primary">Explorar el catálogo</Link>
                <Link to="/communities" className="btn-secondary">Ver comunidades</Link>
              </div>
            }
          />
        )}
      </section>

      <section className="page-shell pt-0">
        <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/70 p-6 shadow-card backdrop-blur-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" aria-hidden="true" />
          <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Organización académica</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-unior-950 sm:text-4xl">Comunidades</h2>
              <p className="section-subtitle">Acceda a las facultades, programas y colecciones del repositorio.</p>
            </div>
            <Link to="/communities" className="link-arrow">
              Explorar todas <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {communities.length > 0 ? (
            <div className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {communities.slice(0, 6).map((community, index) => (
                <Link
                  key={community.id}
                  to={`/search?communityId=${community.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-unior-900/10 bg-paper-50/80 p-5
                    transition-all duration-300 ease-smooth
                    hover:-translate-y-1.5 hover:border-brand-400/30 hover:bg-white hover:shadow-card-xl"
                >
                  <span className="absolute right-4 top-2 font-display text-5xl font-medium text-unior-900/[0.06]" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-unior-950 text-gold-300 shadow-[0_12px_28px_-14px_rgba(61,15,16,.9)]">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-4 font-sans text-base font-bold leading-snug text-unior-950 group-hover:text-unior-700">{community.name}</h3>
                  <p className="relative mt-1.5 line-clamp-2 text-xs leading-5 text-ink-soft/55">
                    {community.shortDescription || 'Explora las colecciones y la producción académica de esta comunidad.'}
                  </p>
                  <div className="relative mt-4 flex items-center justify-between border-t border-unior-900/10 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-soft/45">
                      {community._count?.collections ?? 0} {plural(community._count?.collections ?? 0, 'colección', 'colecciones')}
                      <span className="mx-1.5 text-unior-900/15" aria-hidden="true">·</span>
                      {community._count?.children ?? 0} {plural(community._count?.children ?? 0, 'subcomunidad', 'subcomunidades')}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-unior-900/30 transition group-hover:text-unior-900" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
              title="Estructura académica en preparación"
              description="Las comunidades y colecciones se mostrarán aquí cuando estén disponibles."
            />
          )}
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="surface-hero relative overflow-hidden rounded-4xl">
          <div className="grid-lines absolute inset-0" aria-hidden="true" />
          <div className="halo-brand -right-28 -top-24 h-96 w-96" aria-hidden="true" />
          <div className="halo-brand -bottom-32 left-1/3 h-80 w-80 opacity-60" aria-hidden="true" />

          <div className="relative grid lg:grid-cols-[.92fr_1.08fr]">
            <div className="p-8 sm:p-12 lg:pr-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                Repositorio institucional
              </span>
              <h2 className="mt-5 max-w-md font-display text-3xl font-semibold leading-[1.08] text-white sm:text-[2.6rem]">
                La producción académica de UNIOR, <span className="text-brand-300">en un solo lugar.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-unior-100/55">
                La universidad incorpora y organiza tesis, proyectos y trabajos académicos para facilitar su consulta y preservarlos a largo plazo.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/search" className="btn-brand">
                  Explorar el catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/communities" className="btn border border-white/15 bg-white/[0.06] text-white backdrop-blur-sm hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.12]">
                  Ver comunidades
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-unior-200/45">
                <ShieldCheck className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" /> Acceso abierto y trazabilidad completa
              </p>
            </div>

            <div className="border-t border-white/[0.08] bg-white/[0.02] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="space-y-3">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/30 hover:bg-white/[0.08]">
                      <span className="font-display text-3xl font-bold leading-none text-white/15 transition-colors duration-300 group-hover:text-gold-400/60">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gold-300 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-gold-400 group-hover:text-unior-950 group-hover:shadow-gold">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-unior-200/50">{step.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm;
}

function HeroMetric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-card">
      <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full bg-brand-200/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-100 to-gold-300/50 text-unior-800 transition-transform duration-300 group-hover:scale-110">{icon}</span>
        <span className="font-display text-2xl font-semibold leading-none text-unior-950">{value}</span>
      </div>
      <p className="relative mt-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}
