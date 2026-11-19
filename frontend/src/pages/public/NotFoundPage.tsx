import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-[64vh] items-center justify-center">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-4xl border border-slate-200/80 bg-white p-8 text-center shadow-lift sm:p-12">
        {/* Número 404 de fondo */}
        <span
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 select-none font-display text-[13rem] font-semibold leading-none text-unior-900/[0.035]"
          aria-hidden="true"
        >
          404
        </span>
        {/* Orbe decorativo */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-unior-200/20 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-unior-800 to-unior-950 text-gold-300 shadow-lift ring-4 ring-gold-400/15">
            <Compass className="h-7 w-7 animate-float" aria-hidden="true" />
          </div>
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-600">Error 404</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-unior-950">Esta página no existe</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft/60">
            El enlace puede haber cambiado o el documento ya no está disponible. Vuelva al inicio o busque en el repositorio.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link to="/" className="btn-primary shadow-sm">
              <Home className="h-4 w-4" aria-hidden="true" /> Ir al inicio
            </Link>
            <Link to="/search" className="btn-secondary">
              <Search className="h-4 w-4" aria-hidden="true" /> Buscar documentos
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
