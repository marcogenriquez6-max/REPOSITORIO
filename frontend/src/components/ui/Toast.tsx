import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}

const TONES: Record<ToastTone, { icon: typeof CheckCircle2; iconClass: string; ring: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-600', ring: 'ring-emerald-500/15' },
  error: { icon: XCircle, iconClass: 'text-red-600', ring: 'ring-red-500/15' },
  info: { icon: Info, iconClass: 'text-gold-600', ring: 'ring-gold-500/15' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
    window.setTimeout(() => remove(id), 3800);
  }, [remove]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-7"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const { icon: Icon, iconClass, ring } = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-sm animate-scale-in items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm font-semibold text-unior-950 shadow-lift ring-1 backdrop-blur-md ${ring}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-unior-900"
                aria-label="Cerrar notificación"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
