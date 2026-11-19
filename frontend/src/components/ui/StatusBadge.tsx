import type { ItemStatus } from '../../types';
import { STATUS_BADGES, STATUS_LABELS } from '../../lib/format';

const DOTS: Record<ItemStatus, string> = {
  BORRADOR:    'bg-slate-400',
  EN_REVISION: 'bg-gold-500',
  OBSERVADO:   'bg-amber-500',
  PUBLICADO:   'bg-emerald-500',
  EMBARGADO:   'bg-purple-500',
};

// EN_REVISION tiene dot pulsante para indicar actividad
const PULSES: Record<ItemStatus, boolean> = {
  BORRADOR:    false,
  EN_REVISION: true,
  OBSERVADO:   false,
  PUBLICADO:   false,
  EMBARGADO:   false,
};

export default function StatusBadge({ status, className = '' }: { status: ItemStatus; className?: string }) {
  const pulse = PULSES[status];
  return (
    <span className={`${STATUS_BADGES[status]} ${className}`.trim()}>
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${DOTS[status]} opacity-60`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
}
