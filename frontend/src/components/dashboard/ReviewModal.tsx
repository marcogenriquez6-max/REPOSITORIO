import { useEffect, useId, useRef } from 'react';
import { ClipboardCheck } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ReviewModal({ open, title, message, confirmLabel = 'Confirmar', busy, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-unior-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-paper-50 shadow-2xl animate-scale-in">
        <div className="relative overflow-hidden border-b border-unior-900/10 bg-unior-950 px-6 py-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-6 left-0 h-20 w-20 rounded-full bg-unior-700/20 blur-xl" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-300/15 text-brand-300 ring-1 ring-brand-400/25">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="font-display text-xl font-semibold text-white">{title}</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-unior-200/70">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-white/60 px-6 py-4">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="btn-secondary px-4 py-2 text-xs">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn-primary px-4 py-2 text-xs">
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
