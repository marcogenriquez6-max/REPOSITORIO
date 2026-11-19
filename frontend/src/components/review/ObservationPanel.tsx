import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react';
import type { Observation } from '../../types';
import { reviewApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import Alert from '../ui/Alert';
import { formatDate, OBSERVATION_TYPE_LABELS, ROLE_LABELS } from '../../lib/format';

const schema = z.object({
  type: z.enum(['OBSERVACION', 'DEVOLUCION', 'RECHAZO']),
  description: z.string().trim().min(5, 'La descripción es obligatoria').max(5000),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  itemId: string;
  observations: Observation[];
  canEdit: boolean;
}

export default function ObservationPanel({ itemId, observations, canEdit }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'PENDIENTE' | 'RESUELTA'>('PENDIENTE');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OBSERVACION', description: '' },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['review-observations', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-detail', itemId] });
    queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
  };

  const create = useMutation({ mutationFn: (values: FormValues) => reviewApi.createObservation(itemId, values), onSuccess: () => { reset(); invalidate(); } });
  const resolve = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) => reviewApi.resolveObservation(id, response),
    onSuccess: invalidate,
  });

  const pending = observations.filter((observation) => observation.status === 'PENDIENTE');
  const resolved = observations.filter((observation) => observation.status === 'RESUELTA');
  const visible = tab === 'PENDIENTE' ? pending : resolved;

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleSubmit((values) => create.mutate(values))} className="overflow-hidden rounded-2xl border border-unior-900/10 bg-white shadow-card">
          <div className="border-b border-unior-900/8 bg-gradient-to-r from-unior-50 to-brand-50/30 px-4 py-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-unior-700">Nueva observación</h3>
          </div>
          <div className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-[10rem,1fr]">
            <label className="text-sm font-medium text-slate-700">
              Tipo
              <select {...register('type')} className="input mt-1">
                <option value="OBSERVACION">Observación</option>
                <option value="DEVOLUCION">Devolución</option>
                <option value="RECHAZO">Rechazo</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Descripción <span className="text-red-600">*</span>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describa con precisión qué debe corregir el depositante…"
                className="input mt-1"
              />
            </label>
          </div>
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          {create.isError && <Alert tone="error" title="No se pudo registrar la observación">{getErrorMessage(create.error)}</Alert>}
          {create.isSuccess && <Alert tone="success">Observación registrada correctamente.</Alert>}
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Guardando…' : 'Registrar observación'}
          </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 border-b border-unior-900/10">
        <TabButton active={tab === 'PENDIENTE'} onClick={() => setTab('PENDIENTE')}>Pendientes ({pending.length})</TabButton>
        <TabButton active={tab === 'RESUELTA'} onClick={() => setTab('RESUELTA')}>Resueltas ({resolved.length})</TabButton>
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
          <MessageSquareText className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <p className="text-sm text-slate-500">{tab === 'PENDIENTE' ? 'No hay observaciones pendientes.' : 'No hay observaciones resueltas.'}</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((observation) => (
          <div key={observation.id} className="overflow-hidden rounded-xl border border-unior-900/10 bg-white shadow-sm transition hover:border-unior-900/15 hover:shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-unior-900/8 bg-unior-50/50 px-4 py-2.5 text-xs text-slate-500">
              <span className="flex flex-wrap items-center gap-2">
                <span className="badge-navy">{OBSERVATION_TYPE_LABELS[observation.type] ?? observation.type}</span>
                <span className="font-semibold text-unior-800">{observation.author?.fullName ?? 'Usuario'}</span>
                {observation.author?.role && <span className="text-slate-400">{ROLE_LABELS[observation.author.role]}</span>}
              </span>
              <span className="font-mono">{formatDate(observation.createdAt, true)}</span>
            </div>
            <p className="mt-0 whitespace-pre-wrap px-4 py-3 text-sm text-slate-800">{observation.description}</p>
            {observation.status === 'RESUELTA' && (
              <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Respuesta</p>
                <p className="mt-1 text-sm text-emerald-900">{observation.response}</p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Resuelta por {observation.resolvedBy?.fullName ?? 'usuario'} · {formatDate(observation.resolvedAt, true)}
                </p>
              </div>
            )}
            {observation.status === 'PENDIENTE' && canEdit && (
              <div className="border-t border-unior-900/8 px-4 pb-3 pt-3">
                <ResolveForm id={observation.id} pending={resolve.isPending} onSubmit={(response) => resolve.mutate({ id: observation.id, response })} />
              </div>
            )}
          </div>
        ))}
      </div>
      {resolve.isError && <Alert tone="error" title="No se pudo resolver la observación">{getErrorMessage(resolve.error)}</Alert>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`px-3 py-2 text-sm ${active ? 'border-b-2 border-unior-700 font-medium text-unior-800' : 'text-slate-500 hover:text-slate-700'}`}>{children}</button>;
}

function ResolveForm({ id, pending, onSubmit }: { id: string; pending: boolean; onSubmit: (response: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="mt-3 flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => { event.preventDefault(); if (value.trim()) onSubmit(value.trim()); }}
    >
      <label className="sr-only" htmlFor={`resolve-${id}`}>Respuesta a la observación</label>
      <input
        id={`resolve-${id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Respuesta o corrección realizada"
        className="input flex-1"
      />
      <button type="submit" disabled={pending || !value.trim()} className="btn-success">Marcar resuelta</button>
    </form>
  );
}
