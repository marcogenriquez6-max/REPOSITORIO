import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import ReviewModal from '../../components/dashboard/ReviewModal';
import PdfViewer from '../../components/review/PdfViewer';
import ChecklistPanel from '../../components/review/ChecklistPanel';
import ObservationPanel from '../../components/review/ObservationPanel';
import ReviewHistory from '../../components/review/ReviewHistory';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import StatusBadge from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { reviewApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import type { Item } from '../../types';

type Tab = 'pdf' | 'checks' | 'observations' | 'history';
const decisionSchema = z.object({ comment: z.string().trim().min(1, 'La justificación es obligatoria'), embargoDate: z.string().optional() });
type Decision = z.infer<typeof decisionSchema>;

interface PendingAction {
  title: string;
  message: string;
  confirmLabel: string;
  run: () => Promise<unknown>;
}

export default function ReviewDetailPage() {
  const { itemId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>('pdf');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { register, handleSubmit, getValues, reset, trigger, formState: { errors } } = useForm<Decision>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { comment: '', embargoDate: '' },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['review-detail', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-checks', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-observations', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-history', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
  };

  const mutation = useMutation({
    mutationFn: async (action: PendingAction) => action.run(),
    onSuccess: () => {
      refresh();
      setPending(null);
      reset();
      notify('La acción se ejecutó correctamente. El historial del documento quedó actualizado.', 'success');
    },
    onError: (error: unknown) => notify(getErrorMessage(error, 'No se pudo ejecutar la acción'), 'error'),
  });

  const { data: item, isLoading, isError, error } = useQuery({ queryKey: ['review-detail', itemId], queryFn: () => reviewApi.detail(itemId) });
  const { data: checks = [] } = useQuery({ queryKey: ['review-checks', itemId], queryFn: () => reviewApi.checks(itemId) });
  const { data: observations = [] } = useQuery({ queryKey: ['review-observations', itemId], queryFn: () => reviewApi.observations(itemId) });
  const { data: history = [] } = useQuery({ queryKey: ['review-history', itemId], queryFn: () => reviewApi.history(itemId) });

  const requestAction = (action: PendingAction) => { setPending(action); };

  const runWithComment = async (action: PendingAction) => {
    const valid = await trigger('comment');
    if (!valid) return;
    setPending(action);
  };

  const canReview = user?.role === 'ADMIN' || user?.role === 'REVISOR';
  const inReview = item?.status === 'EN_REVISION';

  if (isLoading) {
    return (
      <div className="page-shell flex flex-col gap-6 md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="page-shell flex flex-col gap-6 md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
            title="No se pudo cargar la revisión"
            description={getErrorMessage(error, 'El documento no existe o no tiene permisos para revisarlo.')}
            action={<button type="button" onClick={() => navigate('/dashboard/review')} className="btn-secondary">Volver a la bandeja</button>}
          />
        </main>
      </div>
    );
  }

  const title = value(item, 'dc', 'title');
  const authors = values(item, 'dc', 'contributor', 'author');
  const advisors = values(item, 'dc', 'contributor', 'advisor');
  const abstract = value(item, 'dc', 'description', 'abstract');
  const keywords = values(item, 'dc', 'subject');
  const year = value(item, 'dc', 'date', 'issued');
  const primaryPdf = item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL' && bitstream.isPrimary)
    ?? item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL');
  const mandatoryChecks = checks.filter((check) => check.mandatory);
  const missingChecks = mandatoryChecks.filter((check) => !(check.passed && check.computed));
  const pendingObservations = observations.filter((observation) => observation.status === 'PENDIENTE');
  const canApprove = inReview && checks.length > 0 && missingChecks.length === 0 && pendingObservations.length === 0;

  return (
    <div className="page-shell flex flex-col gap-6 md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-5">
        <header className="card-premium relative overflow-hidden rounded-4xl p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold-200/35 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <button onClick={() => navigate('/dashboard/review')} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-soft/45 transition-all duration-200 hover:gap-2 hover:text-unior-900">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Volver a la bandeja
              </button>
              <p className="mt-4 eyebrow">Revisión de documento</p>
              <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight text-unior-950 sm:text-4xl">{title || 'Documento sin título'}</h1>
              <p className="mt-2 text-xs font-semibold text-ink-soft/45">
                {item.collection?.community?.name}
                <span className="mx-1.5 text-unior-900/15">/</span>
                {item.collection?.name}
              </p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        </header>

        <section className="card card-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Información general</p>
              <h2 className="mt-1.5 section-title">Datos del depósito</h2>
            </div>
            <span className="chip">Dublin Core</span>
          </div>

          <dl className="mt-5 grid gap-4 rounded-2xl border border-unior-900/10 bg-paper-50/60 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Autores" value={authors.join(', ') || '—'} />
            <Info label="Tutor / Asesor" value={advisors.join(', ') || '—'} />
            <Info label="Programa" value={item.collection?.community?.name ?? '—'} />
            <Info label="Área" value={item.collection?.name ?? '—'} />
            <Info label="Año" value={year || '—'} />
            <Info label="Responsable de revisión" value={item.assignedReviewer?.fullName ?? 'Sin asignar'} />
            <Info label="Fecha de recepción" value={item.submittedAt ? new Date(item.submittedAt).toLocaleString('es-BO') : '—'} />
            <Info label="Depositante" value={item.creator?.fullName ?? '—'} />
          </dl>

          <div className="mt-5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-soft/45">Resumen</h3>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-ink-soft/65">{abstract || 'Sin resumen registrado.'}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-soft/45">Palabras clave</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.length ? keywords.map((keyword, index) => <span key={`${keyword}-${index}`} className="chip">{keyword}</span>) : <span className="text-sm text-ink-soft/50">Sin palabras clave.</span>}
            </div>
          </div>

          <details className="group mt-5 rounded-2xl border border-unior-900/10 bg-white/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-ink-soft/65 transition hover:text-unior-950">
              Metadatos Dublin Core extendidos
            </summary>
            <ul className="space-y-1.5 border-t border-unior-900/10 px-4 py-3 text-xs leading-5 text-ink-soft/60">
              {(item.metadata ?? []).map((metadata, index) => (
                <li key={index}><span className="font-mono text-[10px] text-brand-600">dc.{metadata.element}{metadata.qualifier ? `.${metadata.qualifier}` : ''}</span>: {metadata.value}</li>
              ))}
            </ul>
          </details>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap gap-1 border-b border-unior-900/10 bg-paper-50/50 p-2.5">
            <TabButton active={tab === 'pdf'} onClick={() => setTab('pdf')}>PDF</TabButton>
            <TabButton active={tab === 'checks'} onClick={() => setTab('checks')}>Checklist ({checks.filter((check) => check.passed).length}/{checks.length})</TabButton>
            <TabButton active={tab === 'observations'} onClick={() => setTab('observations')}>Observaciones ({pendingObservations.length})</TabButton>
            <TabButton active={tab === 'history'} onClick={() => setTab('history')}>Historial</TabButton>
          </div>
          <div className="p-4 sm:p-5">
            {tab === 'pdf' && <PdfViewer bitstreamId={primaryPdf?.id} fileName={primaryPdf?.originalName} />}
            {tab === 'checks' && <ChecklistPanel itemId={itemId} checks={checks} canEdit={Boolean(canReview && inReview)} />}
            {tab === 'observations' && <ObservationPanel itemId={itemId} observations={observations} canEdit={Boolean(canReview && inReview)} />}
            {tab === 'history' && <ReviewHistory entries={history} />}
          </div>
        </section>

        {canReview && (
          <section className="card card-body space-y-4">
            <div>
              <p className="eyebrow">Decisión</p>
              <h2 className="mt-1.5 section-title">Acciones de revisión</h2>
              <p className="mt-1 text-xs leading-5 text-ink-soft/55">Toda decisión queda registrada en la auditoría del documento.</p>
            </div>

            {inReview && (
              <div className="rounded-2xl border border-unior-900/10 bg-paper-50/60 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-ink-soft/70">
                  <ClipboardCheck className="h-4 w-4 text-brand-600" aria-hidden="true" /> Requisitos para aprobar
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ReadinessItem
                    ok={checks.length > 0 && missingChecks.length === 0}
                    label="Checklist obligatorio"
                    detail={checks.length === 0 ? 'Cargando checklist…' : missingChecks.length === 0 ? `${mandatoryChecks.length} requisitos cumplidos` : `Faltan: ${missingChecks.map((check) => check.label).join(', ')}`}
                  />
                  <ReadinessItem
                    ok={pendingObservations.length === 0}
                    label="Observaciones pendientes"
                    detail={pendingObservations.length === 0 ? 'Sin observaciones pendientes' : `${pendingObservations.length} observación(es) por resolver`}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit((decision) => {
              const embargoDate = decision.embargoDate || undefined;
              requestAction({
                title: 'Confirmar aprobación',
                message: `Se publicará el documento "${title}". Esta decisión quedará registrada en la auditoría.`,
                confirmLabel: 'Aprobar y publicar',
                run: () => reviewApi.approve(itemId, { comment: decision.comment, embargoDate }),
              });
            })} className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft/65">Justificación / comentario de la decisión <span className="text-red-600">*</span></span>
                <textarea {...register('comment')} rows={2} className="input mt-2" placeholder="Obligatorio para aprobar, devolver o rechazar" />
              </label>
              {errors.comment && <p className="text-xs font-semibold text-red-600">{errors.comment.message}</p>}
              <label className="block">
                <span className="text-xs font-bold text-ink-soft/65">Fecha de embargo (opcional)</span>
                <input type="date" {...register('embargoDate')} className="input mt-2 w-auto" />
                <span className="field-hint">Si indica una fecha futura, el documento se publica con descarga restringida hasta esa fecha.</span>
              </label>
              <div className="flex flex-wrap gap-2 border-t border-unior-900/10 pt-4">
                <button
                  type="button"
                  disabled={!inReview || mutation.isPending}
                  onClick={() => requestAction({ title: 'Iniciar revisión', message: 'El documento quedará asignado a su usuario para su evaluación.', confirmLabel: 'Iniciar', run: () => reviewApi.start(itemId) })}
                  className="btn-secondary"
                >
                  Iniciar revisión
                </button>
                <button
                  type="button"
                  disabled={!inReview || mutation.isPending}
                  onClick={() => runWithComment({
                    title: 'Devolver para corrección',
                    message: 'El documento volverá al depositante para que corrija las observaciones y lo reenvíe a revisión.',
                    confirmLabel: 'Devolver',
                    run: () => reviewApi.returnForCorrection(itemId, getValues('comment')),
                  })}
                  className="btn-secondary"
                >
                  Devolver
                </button>
                <button
                  type="button"
                  disabled={!inReview || mutation.isPending}
                  onClick={() => runWithComment({
                    title: 'Rechazar documento',
                    message: 'El documento será marcado como rechazado con la justificación registrada.',
                    confirmLabel: 'Rechazar',
                    run: () => reviewApi.reject(itemId, getValues('comment')),
                  })}
                  className="btn-danger"
                >
                  Rechazar
                </button>
                <button
                  type="submit"
                  disabled={!canApprove || mutation.isPending}
                  title={!canApprove ? 'Complete el checklist obligatorio y resuelva las observaciones pendientes' : 'Aprobar y publicar el documento'}
                  className="btn-success"
                >
                  Aprobar documento
                </button>
              </div>
              {!canApprove && inReview && (
                <p className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Para aprobar debe completar el checklist obligatorio y resolver todas las observaciones pendientes.
                </p>
              )}
            </form>
          </section>
        )}
      </main>

      <ReviewModal
        open={Boolean(pending)}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel}
        busy={mutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => { if (pending) mutation.mutate(pending); }}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
        active
          ? 'bg-unior-950 text-white shadow-sm'
          : 'text-ink-soft/50 hover:bg-white hover:text-unior-950 hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-soft/40">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-ink-soft/80">{value}</dd>
    </div>
  );
}

function ReadinessItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${ok ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : 'border-amber-200 bg-amber-50/70 text-amber-900'}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
      <span>
        <span className="block font-bold">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 opacity-80">{detail}</span>
      </span>
    </div>
  );
}

function value(item: Item, schema: string, element: string, qualifier?: string): string {
  return item.metadata?.find((metadata) => metadata.schema === schema && metadata.element === element && (!qualifier || metadata.qualifier === qualifier))?.value ?? '';
}

function values(item: Item, schema: string, element: string, qualifier?: string): string[] {
  return (item.metadata ?? []).filter((metadata) => metadata.schema === schema && metadata.element === element && (!qualifier || metadata.qualifier === qualifier)).map((metadata) => metadata.value);
}
