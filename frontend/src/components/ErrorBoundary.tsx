import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de interfaz:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="page-shell flex min-h-[64vh] items-center justify-center">
        <div className="card-premium relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-200/40 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-unior-800 to-unior-950 text-gold-300 shadow-lift ring-4 ring-gold-400/15">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-600">Algo salió mal</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-unior-950">No pudimos mostrar esta sección</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft/60">
              Ocurrió un error inesperado. Puede recargar la página o volver al inicio del repositorio.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => window.location.reload()} className="btn-primary shadow-sm">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Recargar página
              </button>
              <a href="/" className="btn-secondary">
                <Home className="h-4 w-4" aria-hidden="true" /> Ir al inicio
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
