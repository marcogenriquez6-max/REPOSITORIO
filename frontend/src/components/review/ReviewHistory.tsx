import { History } from 'lucide-react';
import type { HistoryEntry } from '../../types';
import { formatDate, STATUS_LABELS } from '../../lib/format';

const labels: Record<string, string> = {
  ENVIADO: 'Enviado a revisión',
  REVISION_INICIADA: 'Revisión iniciada',
  APROBADO: 'Aprobado',
  OBSERVADO: 'Observado',
  DEVUELTO: 'Devuelto para corrección',
  RECHAZADO: 'Rechazado',
  PUBLICADO: 'Publicado',
  EMBARGADO: 'Embargado',
  OBSERVACION: 'Observación registrada',
  DEVOLUCION: 'Devolución registrada',
  RECHAZO: 'Rechazo registrado',
};

const toneByAction: Record<string, string> = {
  APROBADO: 'bg-emerald-500',
  PUBLICADO: 'bg-emerald-500',
  EMBARGADO: 'bg-purple-500',
  RECHAZADO: 'bg-red-500',
  RECHAZO: 'bg-red-500',
  OBSERVADO: 'bg-amber-500',
  OBSERVACION: 'bg-amber-500',
  DEVUELTO: 'bg-amber-500',
  DEVOLUCION: 'bg-amber-500',
  ENVIADO: 'bg-gold-500',
  REVISION_INICIADA: 'bg-gold-500',
};

export default function ReviewHistory({ entries }: { entries: HistoryEntry[] }) {
  if (!entries.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
        <History className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-500">Sin historial de decisiones registrado.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4 border-l-2 border-slate-200 pl-5">
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.id}`} className="relative">
          <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${toneByAction[entry.action] ?? 'bg-slate-400'}`} />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{labels[entry.action] ?? entry.action}</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {entry.kind === 'workflow' ? 'Flujo' : 'Observación'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {entry.actor?.fullName ?? 'Sistema'} · {formatDate(entry.date, true)}
            {entry.fromStatus && entry.toStatus && (
              <> · {STATUS_LABELS[entry.fromStatus]} → {STATUS_LABELS[entry.toStatus]}</>
            )}
          </p>
          {entry.comment && <p className="mt-1 text-sm text-slate-600">{entry.comment}</p>}
          {entry.description && <p className="mt-1 text-sm text-slate-600">{entry.description}</p>}
          {entry.response && <p className="mt-1 rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-800">Respuesta: {entry.response}</p>}
        </li>
      ))}
    </ol>
  );
}
