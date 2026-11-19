import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Check, Copy, Eye, FileText, Link2, Search, ShieldAlert, UserRound } from 'lucide-react';
import { itemsApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import PdfViewer from '../../components/review/PdfViewer';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { formatBytes, formatDate, meta, metaAll, STATUS_DESCRIPTIONS } from '../../lib/format';

export default function ItemDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const { data: item, isLoading, isError, error } = useQuery({ queryKey: ['public-item', id], queryFn: () => itemsApi.get(id) });

  if (isLoading) {
    return (
      <main className="page-shell max-w-6xl">
        <div className="surface-hero mb-5 h-52 animate-pulse rounded-4xl opacity-60" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="card space-y-4 p-6">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-40 w-full" />
          </div>
          <div className="card space-y-4 p-6">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !item) {
    return (
      <main className="page-shell max-w-3xl">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />}
          title="No se pudo mostrar el documento"
          description={getErrorMessage(error, 'El documento no existe o no tiene permisos para verlo.')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/search" className="btn-primary"><Search className="h-4 w-4" aria-hidden="true" /> Buscar documentos</Link>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Volver</button>
            </div>
          }
        />
      </main>
    );
  }

  const title = meta(item, 'title') || 'Documento sin título';
  const authors = metaAll(item, 'contributor', 'author');
  const advisors = metaAll(item, 'contributor', 'advisor');
  const keywords = metaAll(item, 'subject');
  const abstract = meta(item, 'description', 'abstract');
  const primaryPdf = item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL' && bitstream.isPrimary)
    ?? item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL');
  const embargoActive = item.status === 'EMBARGADO' && item.embargoDate && new Date(item.embargoDate).getTime() > Date.now();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      notify('Enlace del documento copiado al portapapeles.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      notify('No se pudo copiar el enlace. Copie la URL del navegador.', 'error');
    }
  };

  return (
    <main className="page-shell max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/search'))} className="inline-flex items-center gap-1.5 rounded-full border border-unior-900/10 bg-white/80 px-4 py-1.5 text-xs font-bold text-ink-soft/70 shadow-sm backdrop-blur-sm transition hover:border-brand-400/40 hover:bg-white hover:text-unior-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
        </button>
        <button type="button" onClick={copyLink} className="btn-secondary px-4 py-2 text-xs">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Enlace copiado' : 'Compartir documento'}
        </button>
      </div>

      <header className="surface-hero relative overflow-hidden rounded-4xl px-5 py-8 text-white sm:px-9 sm:py-10">
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-56 w-56 rounded-full bg-unior-700/30 blur-2xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-20 right-4 font-display text-[16rem] leading-none text-white/[0.035]" aria-hidden="true">U</span>
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hero-eyebrow">{meta(item, 'type') || 'Documento académico'}</span>
              <StatusBadge status={item.status} />
            </div>
            <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.08] text-white sm:text-4xl lg:text-5xl">{title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-unior-100/65">
              {authors.length > 0 && (
                <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-brand-400" aria-hidden="true" /> {authors.join(', ')}</span>
              )}
              {meta(item, 'date', 'issued') && (
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" aria-hidden="true" /> {meta(item, 'date', 'issued')}</span>
              )}
              <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-brand-400" aria-hidden="true" /> {item.viewCount} {item.viewCount === 1 ? 'vista' : 'vistas'}</span>
            </div>
            <p className="mt-4 text-xs font-semibold text-unior-200/55">
              <Link to={`/search?communityId=${item.collection?.community?.id ?? ''}`} className="transition hover:text-brand-300">{item.collection?.community?.name ?? 'Comunidad'}</Link>
              <span className="mx-2 text-white/20">/</span>
              <Link to={`/search?collectionId=${item.collection?.id ?? ''}`} className="transition hover:text-brand-300">{item.collection?.name ?? 'Colección'}</Link>
            </p>
          </div>

          <div className="hidden w-48 lg:block">
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-400/20 bg-brand-400/15 text-brand-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-bold text-white">{primaryPdf ? 'Documento disponible' : 'Sin archivo adjunto'}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-unior-200/55">{primaryPdf?.originalName ?? 'Consulte los metadatos del registro.'}</p>
              {primaryPdf && <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-brand-300/70">{formatBytes(primaryPdf.sizeBytes)}</p>}
              {primaryPdf && <div className="mt-3 h-px w-full bg-white/10" />}
              {primaryPdf && <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-emerald-400">● Acceso abierto</p>}
            </div>
          </div>
        </div>
      </header>

      {embargoActive && (
        <div className="mt-5">
          <Alert tone="warning" title="Documento bajo embargo">
            Los metadatos están disponibles públicamente, pero la descarga del archivo se habilitará el {formatDate(item.embargoDate)}.
          </Alert>
        </div>
      )}

      {item.status === 'EMBARGADO' && !embargoActive && (
        <div className="mt-5">
          <Alert tone="info" title="Embargo finalizado">El documento ya puede consultarse y descargarse.</Alert>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="card card-body">
            <p className="eyebrow">Resumen</p>
            <h2 className="mt-2 section-title">Sobre este documento</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-soft/70">{abstract || 'Este documento no tiene resumen registrado.'}</p>
            {keywords.length > 0 && (
              <div className="mt-5 border-t border-unior-900/10 pt-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-soft/45">Palabras clave</h3>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => <span key={`${keyword}-${index}`} className="chip">{keyword}</span>)}
                </div>
              </div>
            )}
          </section>

          <section className="card card-body">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Archivo</p>
                <h2 className="mt-1.5 section-title">Documento completo</h2>
              </div>
              {primaryPdf && (
                <span className="chip max-w-full">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="max-w-[15rem] truncate">{primaryPdf.originalName}</span>
                  <span className="text-ink-soft/40">·</span> {formatBytes(primaryPdf.sizeBytes)}
                </span>
              )}
            </div>
            {embargoActive ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-12 text-center">
                <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden="true" />
                <p className="text-sm font-bold text-amber-900">Archivo no disponible por embargo</p>
                <p className="max-w-md text-xs leading-5 text-amber-700">
                  Podrá consultar y descargar el documento a partir del {formatDate(item.embargoDate)}.
                </p>
              </div>
            ) : (
              <PdfViewer bitstreamId={primaryPdf?.id} fileName={primaryPdf?.originalName} />
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card card-body">
            <p className="eyebrow">Ficha</p>
            <h2 className="mb-4 mt-2 section-title">Detalles del registro</h2>
            <dl className="divide-y divide-unior-900/8 overflow-hidden rounded-xl border border-unior-900/10">
              <Detail label="Autor(es)" value={authors.join(', ')} highlight />
              <Detail label="Tutor / Asesor" value={advisors.join(', ') || 'No registrado'} />
              <Detail label="Año" value={meta(item, 'date', 'issued')} />
              <Detail label="Tipo" value={meta(item, 'type')} />
              <Detail label="Derechos" value={meta(item, 'rights')} />
              <Detail label="Estado" value={STATUS_DESCRIPTIONS[item.status]} />
              <Detail label="Publicado" value={formatDate(item.publishedAt)} />
              <Detail label="Actualizado" value={formatDate(item.updatedAt)} />
            </dl>
          </section>

          {item.handleUri && (
            <section className="card card-body">
              <h2 className="mb-2 section-title">Identificador permanente</h2>
              <a href={item.handleUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all text-sm font-semibold text-unior-700 hover:underline">
                <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {item.handleUri}
              </a>
            </section>
          )}

          <section className="card-premium p-4 text-xs leading-5 text-ink-soft/65">
            <p className="flex items-center gap-1.5 font-bold text-unior-950">
              <ShieldAlert className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> Uso del documento
            </p>
            <p className="mt-1.5">Respete los derechos de autor y cite la fuente. Los metadatos siguen el estándar Dublin Core.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Detail({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-5 px-4 py-2.5 transition hover:bg-brand-50/40 first:rounded-t-xl last:rounded-b-xl ${highlight ? 'bg-brand-50/30' : 'bg-white'}`}>
      <dt className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-soft/40">{label}</dt>
      <dd className={`text-right text-xs leading-5 ${highlight ? 'font-semibold text-unior-800' : 'text-ink-soft/75'}`}>{value || '—'}</dd>
    </div>
  );
}
