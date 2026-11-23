import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Send, UploadCloud, X } from 'lucide-react';
import { catalogApi, depositApi, itemsApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import type { Collection } from '../../types';
import Alert from '../ui/Alert';
import { formatBytes } from '../../lib/format';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const schema = z.object({
  collectionId: z.string().uuid('Seleccione una colección'),
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(300),
  author: z.string().trim().min(3, 'El autor es obligatorio'),
  advisor: z.string().trim().optional(),
  year: z.string().regex(/^\d{4}$/, 'Ingrese un año válido de 4 dígitos'),
  abstract: z.string().trim().min(10, 'El resumen debe tener al menos 10 caracteres'),
  keywords: z.string().trim().min(3, 'Registre al menos una palabra clave'),
  modality: z.string().trim().min(2, 'Seleccione la modalidad de titulación'),
  type: z.string().trim().min(2, 'Seleccione el tipo de documento'),
  customType: z.string().trim().optional(),
  rights: z.string().trim().min(2, 'Los derechos son obligatorios'),
});

type FormValues = z.infer<typeof schema>;

function buildMetadata(values: FormValues, collections: Collection[]) {
  const selected = collections.find((collection) => collection.id === values.collectionId);
  return [
    { element: 'title', value: values.title },
    { element: 'contributor', qualifier: 'author', value: values.author },
    ...(values.advisor ? [{ element: 'contributor', qualifier: 'advisor', value: values.advisor }] : []),
    { element: 'date', qualifier: 'issued', value: values.year },
    { element: 'description', qualifier: 'abstract', value: values.abstract },
    ...values.keywords.split(',').map((keyword) => ({ element: 'subject', value: keyword.trim() })).filter((keyword) => keyword.value),
    ...(selected ? [{ element: 'subject', qualifier: 'programa', value: selected.name }] : []),
    ...(selected?.community?.name ? [{ element: 'subject', qualifier: 'area', value: selected.community.name }] : []),
    { element: 'type', value: values.type === 'Otro' ? (values.customType || 'Otro') : values.type },
    { element: 'description', qualifier: 'modality', value: values.modality },
    { element: 'rights', value: values.rights },
  ];
}

export default function UploadWizard({ onDone, onCancel }: { onDone: (message: string) => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const itemIdRef = useRef<string | null>(null);
  const uploadedRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rights: 'Uso académico', type: 'Trabajo académico', modality: 'Tesis de Grado', year: String(new Date().getFullYear()) },
  });
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: () => catalogApi.collections() });

  const groupedCollections = collections.reduce<Record<string, typeof collections>>((groups, collection) => {
    const key = collection.community?.name ?? 'Otras colecciones';
    groups[key] = groups[key] ?? [];
    groups[key].push(collection);
    return groups;
  }, {});

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!file) throw new Error('Debe adjuntar el archivo PDF del documento.');
      if (!collections.some((collection) => collection.id === values.collectionId)) {
        throw new Error('La colección seleccionada ya no está disponible.');
      }
      const metadata = buildMetadata(values, collections);
      let itemId = itemIdRef.current;
      if (!itemId) {
        setStage('Creando el registro…');
        const item = await itemsApi.create({ collectionId: values.collectionId, metadata });
        itemId = item.id;
        itemIdRef.current = itemId;
        queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      } else {
        setStage('Actualizando los metadatos…');
        await itemsApi.updateMetadata(itemId, metadata);
      }
      if (!uploadedRef.current) {
        setStage('Subiendo el archivo PDF…');
        await depositApi.upload(itemId, file);
        uploadedRef.current = true;
      }
      setStage('Enviando a revisión…');
      await depositApi.submit(itemId);
      return itemId;
    },
    onSuccess: () => {
      setStage('');
      itemIdRef.current = null;
      uploadedRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      onDone('Documento enviado a revisión correctamente.');
    },
    onError: () => setStage(''),
  });

  const selectFile = (selected: File | null) => {
    setFileError('');
    uploadedRef.current = false;
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

  const submit = handleSubmit((values) => {
    if (!file) {
      setFileError('Debe adjuntar el archivo PDF antes de enviar el depósito.');
      return;
    }
    mutation.mutate(values);
  });

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="relative overflow-hidden border-b border-white/10 bg-unior-950 px-5 py-6 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-brand-400/15" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-300">Nuevo envío</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Nuevo depósito</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-unior-100/75">Describa el trabajo y adjunte su archivo para enviarlo a revisión del comité.</p>
          </div>
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-unior-200 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar formulario">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="relative mt-6 grid max-w-lg grid-cols-2 gap-3" aria-label="Pasos del depósito">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-300 text-xs font-extrabold text-unior-950">1</span>
            <span className="text-xs font-bold text-white">Datos del trabajo</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-unior-100">2</span>
            <span className="text-xs font-semibold text-unior-100/75">Archivo PDF</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-unior-100 text-unior-800"><FileText className="h-4 w-4" aria-hidden="true" /></span>
            <div>
              <h3 className="text-sm font-bold text-unior-950">Información del documento</h3>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">Los campos con * son obligatorios. Ayudan a que otras personas encuentren su trabajo.</p>
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Colección <span className="ml-1 text-red-600" aria-hidden="true">*</span>
            <select {...register('collectionId')} className="input mt-2">
              <option value="">Seleccione una colección…</option>
              {Object.entries(groupedCollections).map(([communityName, group]) => (
                <optgroup key={communityName} label={communityName}>
                  {group.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.collectionId && <span className="mt-1.5 block text-xs font-semibold text-red-700" role="alert">{errors.collectionId.message}</span>}
          </label>

          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="Título" error={errors.title?.message}><input {...register('title')} className="input" placeholder="Título completo del trabajo" /></Field>
            <Field label="Autor" error={errors.author?.message}><input {...register('author')} className="input" placeholder="Nombre y apellidos" /></Field>
            {watch('modality') !== 'Examen de grado' && (<Field label="Tutor o asesor" optional><input {...register('advisor')} className="input" placeholder="Nombre del tutor (opcional)" /></Field>)}
            <Field label="Año" error={errors.year?.message}><input {...register('year')} inputMode="numeric" placeholder="AAAA" className="input" /></Field>
            <Field label="Modalidad de titulación" error={errors.modality?.message}>
              <select {...register('modality')} className="input">
                <option value="Tesis de Grado">Tesis de Grado</option>
                <option value="Proyecto de Grado">Proyecto de Grado</option>
                <option value="Examen de grado">Examen de grado</option>
                <option value="Trabajo de Diplomado">Trabajo de Diplomado</option>
                <option value="Trabajo de Titulación">Trabajo de Titulación</option>
                <option value="Otra">Otra</option>
              </select>
            </Field>
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
                <option value="Otro">Otro (especificar)</option>
              </select>
              {watch('type') === 'Otro' && (
                <input {...register('customType')} className="input mt-2" placeholder="Especifique el tipo de documento" />
              )}
            </Field>
            <Field label="Derechos" error={errors.rights?.message}><input {...register('rights')} className="input" placeholder="Ej. Uso académico" /></Field>
          </div>

          <Field label="Resumen" error={errors.abstract?.message}>
            <textarea {...register('abstract')} rows={5} className="input resize-y" placeholder="Explique brevemente el tema, objetivo y principales aportes del trabajo." />
          </Field>
          <Field label="Palabras clave (separadas por coma)" error={errors.keywords?.message}>
            <input {...register('keywords')} className="input" placeholder="Ej. repositorio institucional, gestión documental" />
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-unior-100 text-unior-800"><UploadCloud className="h-4 w-4" aria-hidden="true" /></span>
            <div>
              <h3 className="text-sm font-bold text-unior-950">Archivo del documento <span className="text-red-600" aria-hidden="true">*</span></h3>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">Adjunte el documento final en PDF. Tamaño máximo: 20 MB.</p>
            </div>
          </div>

          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-7 text-center transition ${
              fileError ? 'border-red-400 bg-red-50' : dragging ? 'border-unior-500 bg-unior-50' : 'border-slate-300 bg-slate-50 hover:border-unior-400 hover:bg-unior-50/70'
            }`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0] ?? null); }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-unior-700 shadow-sm ring-1 ring-slate-200">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-unior-950">{file ? 'Cambiar archivo PDF' : 'Seleccione un archivo o arrástrelo aquí'}</span>
            <span className="text-xs text-slate-500">Formato PDF · hasta 20 MB</span>
            <input type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Seleccionar archivo PDF" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
          </label>

          {file && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-sm text-emerald-800">
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{file.name}</span>
              <span className="text-[10px] font-bold">{formatBytes(file.size)}</span>
              <button type="button" onClick={() => setFile(null)} className="rounded p-0.5 hover:bg-emerald-100" aria-label="Quitar archivo">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {fileError && <p className="text-sm font-semibold text-red-700" role="alert">{fileError}</p>}
        </section>

        {mutation.isError && <Alert tone="error" title="No se pudo completar el depósito">{getErrorMessage(mutation.error)}</Alert>}
        {stage && <Alert tone="info">{stage}</Alert>}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-xs leading-5 text-slate-500">Al enviar, el comité recibirá su trabajo para revisión.</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {onCancel && <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2.5 text-sm" disabled={mutation.isPending}>Cancelar</button>}
          <button type="submit" disabled={mutation.isPending} className="btn-primary px-4 py-2.5 text-sm">
            <Send className="h-4 w-4" aria-hidden="true" /> {mutation.isPending ? (stage || 'Procesando…') : 'Enviar a revisión'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, error, optional = false, children }: { label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      <span>{label}{optional ? <span className="ml-1 font-normal text-slate-500">(opcional)</span> : <span className="ml-1 text-red-600" aria-hidden="true">*</span>}</span>
      <div className="mt-2 font-normal">{children}</div>
      {error && <span className="mt-1.5 block text-xs font-semibold text-red-700" role="alert">{error}</span>}
    </label>
  );
}
