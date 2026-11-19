import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-unior-900/[0.12] bg-white px-6 py-14 text-center shadow-card animate-fade-in">
      {/* Orbe de fondo */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-5">
        {icon && (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-unior-800 to-unior-950 text-brand-300 shadow-lift ring-4 ring-brand-400/10">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-xl font-semibold text-unior-950">{title}</h3>
          {description && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft/60">{description}</p>
          )}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
