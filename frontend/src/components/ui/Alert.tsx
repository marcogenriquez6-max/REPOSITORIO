import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Tone = 'info' | 'success' | 'warning' | 'error';

const styles: Record<Tone, { wrapper: string; icon: string; bar: string }> = {
  info:    { wrapper: 'border-blue-200/70 bg-blue-50/80 text-blue-900',    icon: 'text-blue-500',    bar: 'bg-blue-500' },
  success: { wrapper: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-900', icon: 'text-emerald-500', bar: 'bg-emerald-500' },
  warning: { wrapper: 'border-amber-200/70 bg-amber-50/80 text-amber-900', icon: 'text-amber-500',   bar: 'bg-amber-500' },
  error:   { wrapper: 'border-red-200/70 bg-red-50/80 text-red-900',       icon: 'text-red-500',     bar: 'bg-red-500' },
};

const icons: Record<Tone, typeof Info> = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
};

export default function Alert({ tone = 'info', title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const Icon = icons[tone];
  return (
    <div
      className={`relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm shadow-sm backdrop-blur-sm ${styles[tone].wrapper}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {/* Barra lateral de color */}
      <span className={`absolute inset-y-0 left-0 w-[3px] rounded-l-xl ${styles[tone].bar}`} aria-hidden="true" />
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles[tone].icon}`} aria-hidden="true" />
      <div className="min-w-0 leading-6">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-sm opacity-85' : ''}>{children}</div>}
      </div>
    </div>
  );
}
