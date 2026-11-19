import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { ROLE_LABELS, initials } from '../../lib/format';

const publicLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/communities', label: 'Comunidades', end: false },
  { to: '/search', label: 'Catálogo', end: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    notify('Sesión cerrada correctamente.', 'info');
    navigate('/');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'rounded-full bg-unior-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10'
      : 'nav-link nav-underline';

  const panelLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive ? 'bg-unior-950 text-white shadow-sm' : 'text-unior-900/75 hover:bg-white hover:text-unior-950'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/70 bg-white/85 shadow-[0_10px_34px_-18px_rgba(6,22,47,.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/75'
          : 'border-slate-200/80 bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" aria-hidden="true" />
      <nav className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10" aria-label="Navegación principal">
        <Link to="/" className="flex min-w-0 items-center transition-opacity duration-200 hover:opacity-80" aria-label="Ir al inicio del Repositorio UNIOR">
          <img src="/unior-logo-dark.png" alt="Universidad Privada de Oruro" className="h-11 w-auto shrink-0 object-contain sm:h-14" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <span className="mx-1.5 h-5 w-px bg-unior-900/10" aria-hidden="true" />
              <NavLink to="/dashboard" end className={navClass}>Mi panel</NavLink>
              {(user.role === 'REVISOR' || user.role === 'ADMIN') && (
                <NavLink to="/dashboard/review" className={navClass}>Revisión</NavLink>
              )}
              {user.role === 'ADMIN' && <NavLink to="/dashboard/admin" className={navClass}>Administración</NavLink>}
              <div className="ml-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 py-1 pl-1 pr-1.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:shadow">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-unior-800 to-unior-950 text-[11px] font-extrabold text-brand-300 ring-2 ring-brand-400/20" aria-hidden="true">
                  {initials(user.fullName)}
                </span>
                <span className="hidden max-w-[9rem] leading-tight lg:block">
                  <span className="block truncate text-xs font-bold text-unior-950">{user.fullName}</span>
                  <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink-soft/50">
                    <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" /> {ROLE_LABELS[user.role]}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary ml-2 px-4 py-2 text-xs shadow-nav">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Iniciar sesión
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-unior-900 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block transition-all duration-200 ${open ? 'rotate-90' : 'rotate-0'}`}>
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </span>
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="animate-scale-in border-t border-slate-200 bg-white/95 px-4 pb-5 pt-3 shadow-md backdrop-blur-sm md:hidden"
        >
          <div className="space-y-1">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={panelLinkClass}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <div className="my-3 divider-gradient" />
                <div className="mb-2 flex items-center gap-3 rounded-2xl border border-unior-900/10 bg-slate-50/80 px-3 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-unior-800 to-unior-950 text-xs font-bold text-brand-300 ring-2 ring-brand-400/20" aria-hidden="true">
                    {initials(user.fullName)}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-bold text-unior-950">{user.fullName}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft/50">{ROLE_LABELS[user.role]}</span>
                  </span>
                </div>
                <NavLink to="/dashboard" end className={panelLinkClass}>
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Mi panel
                </NavLink>
                {(user.role === 'REVISOR' || user.role === 'ADMIN') && (
                  <NavLink to="/dashboard/review" className={panelLinkClass}>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Revisión
                  </NavLink>
                )}
                {user.role === 'ADMIN' && (
                  <NavLink to="/dashboard/admin" className={panelLinkClass}>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Administración
                  </NavLink>
                )}
                <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary mt-2 w-full">
                <LogIn className="h-4 w-4" aria-hidden="true" /> Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
