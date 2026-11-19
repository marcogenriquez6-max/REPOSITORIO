import { NavLink, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, LayoutDashboard, Library, Settings, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, initials } from '../../lib/format';

interface SidebarLink {
  to: string;
  label: string;
  roles: Array<'DEPOSITANTE' | 'REVISOR' | 'ADMIN'>;
  icon: LucideIcon;
  end?: boolean;
}

const links: SidebarLink[] = [
  { to: '/dashboard',        label: 'Mis depósitos',      roles: ['DEPOSITANTE', 'REVISOR', 'ADMIN'], icon: LayoutDashboard, end: true },
  { to: '/dashboard/review', label: 'Bandeja de revisión', roles: ['REVISOR', 'ADMIN'],                icon: ClipboardCheck },
  { to: '/dashboard/admin',  label: 'Administración',      roles: ['ADMIN'],                           icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-full shrink-0 md:sticky md:top-24 md:w-64 md:self-start">
      <div className="dashboard-aside overflow-hidden">
        {/* Perfil */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-gold-400/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full border border-gold-400/20" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 font-display text-sm font-semibold text-white shadow-brand ring-2 ring-gold-400/30"
              aria-hidden="true"
            >
              {initials(user?.fullName)}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-gold-400">Panel de gestión</p>
              <p className="mt-0.5 truncate text-sm font-bold text-white">{user?.fullName}</p>
              <p className="text-[10px] font-semibold text-unior-300/70">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-2 space-y-0.5 p-1.5" aria-label="Secciones del panel">
          {links.filter((link) => user && link.roles.includes(user.role)).map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border border-white/10 bg-white/10 text-white shadow-sm'
                      : 'border border-transparent text-unior-200/55 hover:border-white/[0.06] hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                      isActive ? 'bg-white/10 text-gold-300' : 'text-unior-300/50 group-hover:text-unior-200'
                    }`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {link.label}
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-unior-200/45 transition-all duration-200 hover:bg-white/[0.05] hover:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-unior-300/40">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </span>
            Volver al repositorio
          </Link>
          <Link to="/search" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-unior-200/45 transition-all duration-200 hover:bg-white/[0.05] hover:text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-unior-300/40">
              <Library className="h-4 w-4" aria-hidden="true" />
            </span>
            Explorar documentos
          </Link>
        </nav>
      </div>

      <p className="mt-3 px-1 text-[10px] leading-5 text-ink-soft/30">
        Repositorio Institucional UNIOR · Metadatos Dublin Core
      </p>
    </aside>
  );
}
