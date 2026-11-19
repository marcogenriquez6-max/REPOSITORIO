import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[#e2d8ce] bg-[#f0e9e1] text-slate-600">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-unior-200/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1680px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_.7fr_1fr] lg:gap-16">

          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center transition-opacity duration-200 hover:opacity-80" aria-label="Ir al inicio del Repositorio UNIOR">
              <img src="/unior-logo-dark.png" alt="Universidad Privada de Oruro" className="h-14 w-auto max-w-[180px] object-contain" />
            </Link>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Producción académica de UNIOR, organizada por la universidad y abierta a la consulta de toda la comunidad.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-200/40 px-3 py-1.5 text-xs font-semibold text-brand-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" aria-hidden="true" />
              Acceso abierto al conocimiento
            </span>
          </div>

          <nav aria-label="Enlaces del repositorio">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-unior-950">Explorar</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/search" className="inline-flex items-center gap-1.5 transition-all duration-200 hover:gap-2.5 hover:text-brand-600">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link to="/communities" className="inline-flex items-center gap-1.5 transition-all duration-200 hover:gap-2.5 hover:text-brand-600">
                  Comunidades
                </Link>
              </li>
              <li>
                <Link to="/login" className="inline-flex items-center gap-1.5 transition-all duration-200 hover:gap-2.5 hover:text-brand-600">
                  Acceso institucional
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-unior-950">Contacto</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="mailto:repositorio@unior.edu.bo"
                  className="group inline-flex items-center gap-2.5 transition-colors duration-200 hover:text-brand-600"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-200/60 text-brand-600 transition-colors duration-200 group-hover:bg-brand-400 group-hover:text-white">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  repositorio@unior.edu.bo
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-slate-500">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-unior-100/80 text-unior-600">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Dirección de Postgrado · UNIOR
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 h-px bg-gradient-to-r from-transparent via-[#c9bfb5] to-transparent" aria-hidden="true" />
        <div className="flex flex-col gap-2 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Universidad Privada de Oruro. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-brand-400/60" aria-hidden="true" />
            Preservando la memoria académica de Oruro.
          </p>
        </div>
      </div>
    </footer>
  );
}
