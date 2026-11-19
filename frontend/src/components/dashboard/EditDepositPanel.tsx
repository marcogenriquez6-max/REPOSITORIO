import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Save, UploadCloud, X } from 'lucide-react';
import { depositApi, itemsApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import Alert from '../ui/Alert';
import { Skeleton } from '../ui/Skeleton';
import { formatBytes, formatDate, meta, metaAll, OBSERVATION_TYPE_LABELS } from '../../lib/format';
import type { Item, MetadataValue } from '../../types';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const schema = z.object({
  title: z.string().trim().min(3, 'El título es obligatorio').max(300),
  author: z.string().trim().min(3, 'El autor es obligatorio'),
  advisor: z.string().trim().optional(),
  year: z.string().regex(/^\d{4}$/, 'Ingrese un año válido de 4 dígitos'),
  abstract: z.string().trim().min(10, 'El resumen debe tener al menos 10 caracteres'),
  keywords: z.string().trim().min(3, 'Registre al menos una palabra clave'),
  type: z.string().trim().min(2, 'El tipo de documento es obligatorio'),
  rights: z.string().trim().min(2, 'Los derechos son obligatorios'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  itemId: string;
  onClose: () => void;
  onDone: (message: string) => void;
}

function isManagedMetadata(metadata: MetadataValue): boolean {
  if (metadata.element === 'title' && !metadata.qualifier) return true;
  if (metadata.element === 'contributor' && ['author', 'advisor'].includes(metadata.qualifier ?? '')) return true;
  if (metadata.element === 'date' && metadata.qualifier === 'issued') return true;
  if (metadata.element === 'description' && metadata.qualifier === 'abstract') return true;
  if (metadata.element === 'subject') return true;
  if (metadata.element === 'type' && !metadata.qualifier) return true;
  if (metadata.element === 'rights' && !metadata.qualifier) return true;
  return false;
}

function splitList(value: string): string[] {
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function buildMetadata(item: Item, values: FormValues) {
  const preserved = (item.metadata ?? []).filter((metadata) => !isManagedMetadata(metadata));
  const managed: MetadataValue[] = [
    { element: 'title', value: values.title },
    ...splitList(values.author).map((author) => ({ element: 'contributor', qualifier: 'author', value: author })),
    ...splitList(values.advisor ?? '').map((advisor) => ({ element: 'contributor', qualifier: 'advisor', value: advisor })),
    { element: 'date', qualifier: 'issued', value: values.year },
    { element: 'description', qualifier: 'abstract', value: values.abstract },
    ...splitList(values.keywords).map((keyword) => ({ element: 'subject', value: keyword })),
    { element: 'type', value: values.type },
    { element: 'rights', value: values.rights },
  ].map((metadata) => ({ schema: 'dc', ...metadata }));
  return [...preserved, ...managed].map((metadata) => ({
    schema: metadata.schema,
    element: metadata.element,
    qualifier: metadata.qualifier ?? null,
    value: metadata.value,
  }));
}

export default function EditDepositPanel({ itemId, onClose, onDone }: Props) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [stage, setStage] = useState('');
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ['deposit-detail', itemId],
    queryFn: () => itemsApi.get(itemId),
  });

  useEffect(() => {
    if (!item) return;
    reset({
      title: meta(item, 'title'),
      author: metaAll(item, 'contributor', 'author').join(', '),
      advisor: metaAll(item, 'contributor', 'advisor').join(', '),
      year: meta(item, 'date', 'issued'),
      abstract: meta(item, 'description', 'abstract'),
      keywords: metaAll(item, 'subject').join(', '),
      type: meta(item, 'type') || 'Trabajo académico',
      rights: meta(item, 'rights') || 'Uso académico',
    });
  }, [item, reset]);

  const mutation = useMutation({
    mutationFn: async ({ values, submit }: { values: FormValues; submit: boolean }) => {
      if (!item) throw new Error('No se pudo cargar el documento');
      setStage('Guardando metadatos…');
      await itemsApi.updateMetadata(itemId, buildMetadata(item, values));
      if (file) {
        setStage('Subiendo el PDF corregido…');
        await depositApi.upload(itemId, file);
      }
      if (submit) {
        setStage('Reenviando a revisión…');
        await depositApi.submit(itemId);
      }
      return submit ? 'Documento corregido y reenviado a revisión.' : 'Cambios guardados correctamente.';
    },
    onSuccess: (message) => {
      setStage('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['deposit-detail', itemId] });
      queryClient.invalidateQueries({ queryKey: ['public-item', itemId] });
      onDone(message);
    },
    onError: () => setStage(''),
  });

  const selectFile = (selected: File | null) => {
    setFileError('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Solo se permiten archivos PDF.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('El archivo supera el máximo permitido de 20 MB.');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-3xl border border-unior-900/10 bg-white/85 p-6 shadow-card">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !item) {
    return <Alert tone="error" title="No se pudo cargar el depósito">{getErrorMessage(error)}</Alert>;
  }

  const primaryPdf = item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL' && bitstream.isPrimary)
    ?? item.bitstreams?.find((bitstream) => bitstream.bundle === 'ORIGINAL');
  const pendingObservations = (item.observations ?? []).filter((observation) => observation.status === 'PENDIENTE');

  return (
    <form className="overflow-hidden rounded-3xl border border-unior-900/10 bg-white/90 shadow-lift backdrop-blur-sm" onSubmit={handleSubmit((values) => mutation.mutate({ values, submit: true }))}>
      <div className="relative overflow-hidden border-b border-unior-900/10 bg-unior-950 px-5 py-5 text-white sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-brand-400/15" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-brand-400">Corrección</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white">Corregir depósito</h2>
            <p className="mt-1 text-xs leading-5 text-unior-200/60">Actualice los metadatos y, si corresponde, reemplace el archivo PDF.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-unior-200 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar corrección">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-brand-500/20 bg-brand-300/10 px-4 py-3">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-600">Colección</p>
          <p className="mt-1 text-xs font-semibold text-ink-soft/75">{item.collection?.community?.name} / {item.collection?.name}</p>
        </div>

        {pendingObservations.length > 0 && (
          <Alert tone="warning" title="Observaciones pendientes de corregir">
            <ul className="mt-2 space-y-2">
              {pendingObservations.map((observation) => (
                <li key={observation.id} className="rounded-lg bg-white/60 p-2.5">
                  <p className="text-xs leading-5">{observation.description}</p>
                  <p className="mt-1 text-[10px] font-semibold text-amber-800/75">
                    {OBSERVATION_TYPE_LABELS[observation.type] ?? observation.type} · {formatDate(observation.createdAt, true)} · {observation.author?.fullName ?? 'Revisor'}
                  </p>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" error={errors.title?.message}><input {...register('title')} className="input" /></Field>
          <Field label="Autor" error={errors.author?.message}><input {...register('author')} className="input" /></Field>
          {watch('type') !== 'Examen de grado' && <Field label="Tutor / Asesor"><input {...register('advisor')} className="input" /></Field>}
          <Field label="Año" error={errors.year?.message}><input {...register('year')} inputMode="numeric" placeholder="AAAA" className="input" /></Field>
          <Field label="Tipo de documento" error={errors.type?.message}>
            <select {...register('type')} className="input">
              <option value="Tesis de Grado">Tesis de Grado</option>
              <option value="Proyecto de Grado">Proyecto de Grado</option>
              <option value="Trabajo de Diplomado">Trabajo de Diplomado</option>
              <option value="Trabajo de Titulación">Trabajo de Titulación</option>
              <option value="Trabajo académico">Trabajo académico</option>
              <option value="Examen de grado">Examen de grado</option>
              <option value="Tesis de Maestría">Tesis de Maestría</option>
              <option value="Tesis Doctoral">Tesis Doctoral</option>
              <option value="Monografía">Monografía</option>
              <option value="Artículo">Artículo</option>
              <option value="Informe">Informe</option>
            </select>
          </Field>
          <Field label="Derechos" error={errors.rights?.message}><input {...register('rights')} className="input" /></Field>
        </div>

        <Field label="Resumen" error={errors.abstract?.message}><textarea {...register('abstract')} rows={4} className="input" /></Field>
        <Field label="Palabras clave (separadas por coma)" error={errors.keywords?.message}><input {...register('keywords')} className="input" /></Field>

        <div className="overflow-hidden rounded-2xl border border-unior-900/10 bg-paper-50/60">
          <div className="flex items-center gap-2 border-b border-unior-900/8 bg-unior-50/60 px-4 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="text-xs font-bold text-unior-950">Archivo actual</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-ink-soft/60">
              {primaryPdf ? `${primaryPdf.originalName} · ${formatBytes(primaryPdf.sizeBytes)}` : 'Sin archivo PDF adjunto.'}
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-unior-900/10 bg-white px-3 py-1.5 text-[11px] font-bold text-unior-900 shadow-sm transition hover:border-brand-400/50 hover:bg-brand-50 hover:text-brand-700">
              <UploadCloud className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" /> Reemplazar PDF
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
            </label>
            {file && <p className="mt-2 text-[10px] font-semibold text-emerald-700">Nuevo archivo: {file.name} · {formatBytes(file.size)}</p>}
            {fileError && <p className="mt-2 text-[10px] font-semibold text-red-600">{fileError}</p>}
            <p className="mt-2 text-[10px] leading-4 text-ink-soft/40">El PDF anterior se conserva como versión histórica. Solo se permite PDF de hasta 20 MB.</p>
          </div>
        </div>

        {mutation.isError && <Alert tone="error" title="No se pudieron guardar los cambios">{getErrorMessage(mutation.error)}</Alert>}
        {stage && <Alert tone="info">{stage}</Alert>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-unior-900/10 bg-paper-50/70 px-5 py-4 sm:px-6">
        <button type="submit" disabled={mutation.isPending || Boolean(fileError)} className="btn-primary px-4 py-2 text-xs">
          <Save className="h-3.5 w-3.5" aria-hidden="true" /> {mutation.isPending ? 'Procesando…' : 'Guardar y reenviar'}
        </button>
        <button
          type="button"
          disabled={mutation.isPending || Boolean(fileError)}
          onClick={handleSubmit((values) => mutation.mutate({ values, submit: false }))}
          className="btn-secondary px-4 py-2 text-xs"
        >
          Guardar sin enviar
        </button>
        <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-xs" disabled={mutation.isPending}>Cancelar</button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold text-ink-soft/65">
      {label}
      <div className="mt-2 font-normal">{children}</div>
      {error && <span className="mt-1.5 block text-[10px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}
