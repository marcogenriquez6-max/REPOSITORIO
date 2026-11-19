import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Eye, EyeOff, FileCheck2, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/errors';
import Alert from '../../components/ui/Alert';
import { useToast } from '../../components/ui/Toast';
import type { Role } from '../../types';

function homeForRole(role: Role) {
  return role === 'ADMIN' ? '/dashboard/admin' : role === 'REVISOR' ? '/dashboard/review' : '/dashboard';
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState(() => localStorage.getItem('unior:lastEmail') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('unior:sessionExpired')) {
      sessionStorage.removeItem('unior:sessionExpired');
      setNotice('Su sesión expiró por seguridad. Inicie sesión nuevamente.');
    }
  }, []);

  useEffect(() => {
    if (user) navigate(from || homeForRole(user.role), { replace: true });
  }, [user, from, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      localStorage.setItem('unior:lastEmail', email.trim());
      notify('Bienvenido de nuevo al repositorio UNIOR.', 'success');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Credenciales inválidas. Verifique su correo y contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell max-w-6xl py-8 sm:py-12">
      <div className="grid overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-lift lg:grid-cols-[1fr_1.02fr]">

        {/* Panel izquierdo — hero */}
        <section className="surface-hero relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
              <img src="/unior-logo-light.png" alt="Universidad Privada de Oruro" className="h-12 w-auto max-w-[190px] object-contain" />
              <span className="text-sm font-semibold text-white/80">Repositorio institucional</span>
            </Link>

            <p className="mt-16 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-400">Área privada</p>
            <h2 className="mt-3 max-w-sm font-display text-4xl font-semibold leading-[1.08] text-white">
              La memoria académica de UNIOR, organizada y preservada.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-unior-200/60">
              Acceda para administrar documentos, revisar propuestas o gestionar la estructura académica.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: BookOpen, title: 'Gestione documentos académicos', desc: 'Registros organizados para el catálogo institucional.' },
              { icon: FileCheck2, title: 'Revise con trazabilidad', desc: 'Checklists, observaciones e historial completo.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 transition-colors duration-200 hover:border-white/[0.15] hover:bg-white/[0.08]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-400/20 text-brand-300 ring-1 ring-brand-400/20">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="text-[10px] text-unior-200/50">{desc}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-unior-300/45 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-400/60" aria-hidden="true" /> Acceso protegido · JWT
              </p>
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-brand-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400/60 animate-pulse-soft" aria-hidden="true" /> En línea
              </span>
            </div>
          </div>
        </section>

        {/* Panel derecho — formulario */}
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
            <div className="mb-8">
              <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft/45 transition-all duration-200 hover:gap-2 hover:text-unior-900 lg:hidden">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Volver al repositorio
              </Link>
              <img src="/unior-logo-dark.png" alt="Universidad Privada de Oruro" className="h-12 w-auto max-w-[160px] object-contain" />
              <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-unior-950 sm:text-4xl">Acceso al sistema</h1>
              <p className="mt-2 text-sm leading-6 text-ink-soft/55">Ingrese con sus credenciales institucionales para continuar.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label mb-2 block">Correo institucional</label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/30 transition-colors duration-200 group-focus-within:text-brand-500" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    required
                    className="input pl-11"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }}
                    placeholder="nombre@unior.edu.bo"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label mb-2 block">Contraseña</label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/30 transition-colors duration-200 group-focus-within:text-brand-500" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pl-11 pr-11"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }}
                    onKeyUp={(event) => setCapsLock(event.getModifierState?.('CapsLock') ?? false)}
                    onBlur={() => setCapsLock(false)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-soft/35 transition-colors duration-200 hover:text-unior-900"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="mt-1.5 text-xs font-semibold text-amber-600" role="status">
                    Bloq Mayús está activado.
                  </p>
                )}
              </div>

              {notice && <Alert tone="info">{notice}</Alert>}
              {error && <Alert tone="error">{error}</Alert>}

              <button type="submit" disabled={loading || !email.trim() || !password} className="btn-primary w-full py-3 shadow-sm">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                    Verificando…
                  </>
                ) : (
                  <><LogIn className="h-4 w-4" aria-hidden="true" /> Ingresar</>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-unior-900/[0.08] bg-paper-50/80 px-4 py-3.5 text-xs leading-5 text-ink-soft/55">
              <p className="font-bold text-unior-900">¿No cuenta con credenciales?</p>
              <p className="mt-0.5">
                Contacte al administrador en{' '}
                <a href="mailto:repositorio@unior.edu.bo" className="font-semibold text-unior-700 transition hover:underline">
                  repositorio@unior.edu.bo
                </a>.
              </p>
            </div>

            <Link to="/" className="mt-6 hidden items-center justify-center gap-1.5 text-xs font-bold text-ink-soft/40 transition-all duration-200 hover:gap-2 hover:text-unior-900 lg:flex">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Volver al repositorio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
