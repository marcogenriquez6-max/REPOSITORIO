import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/public/HomePage';
import SearchPage from './pages/public/SearchPage';
import CommunitiesPage from './pages/public/CommunitiesPage';
import ItemDetailPage from './pages/public/ItemDetailPage';
import LoginPage from './pages/auth/LoginPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ScrollToTop from './components/ScrollToTop';
import PrivateRoute from './routes/PrivateRoute';

const MyDepositsPage = lazy(() => import('./pages/dashboard/MyDepositsPage'));
const ReviewInboxPage = lazy(() => import('./pages/dashboard/ReviewInboxPage'));
const ReviewDetailPage = lazy(() => import('./pages/dashboard/ReviewDetailPage'));
const AdminPage = lazy(() => import('./pages/dashboard/AdminPage'));

const TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/review\/.+/, 'Revisión de documento'],
  [/^\/dashboard\/review/, 'Bandeja de revisión'],
  [/^\/dashboard\/admin/, 'Administración'],
  [/^\/dashboard/, 'Mis depósitos'],
  [/^\/items\//, 'Documento'],
  [/^\/search/, 'Catálogo'],
  [/^\/communities/, 'Comunidades'],
  [/^\/login/, 'Iniciar sesión'],
];

function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname));
    document.title = `${match?.[1] ?? 'Repositorio institucional'} · UNIOR`;
  }, [pathname]);

  return null;
}

function RoutedContent({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div id="contenido" tabIndex={-1} className="flex-1 outline-none">
      <div key={pathname} className="route-fade">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <RouteTitle />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-unior-950 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lift"
      >
        Saltar al contenido
      </a>
      <div className="flex min-h-screen flex-col text-ink-soft">
        <Navbar />
        <RoutedContent>
          <ErrorBoundary>
            <Suspense fallback={<div className="page-shell"><div className="card h-48 animate-pulse bg-white/60" /></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<PrivateRoute><MyDepositsPage /></PrivateRoute>} />
              <Route path="/dashboard/review" element={<PrivateRoute roles={['REVISOR', 'ADMIN']}><ReviewInboxPage /></PrivateRoute>} />
              <Route path="/dashboard/review/:itemId" element={<PrivateRoute roles={['REVISOR', 'ADMIN']}><ReviewDetailPage /></PrivateRoute>} />
              <Route path="/dashboard/admin" element={<PrivateRoute roles={['ADMIN']}><AdminPage /></PrivateRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </RoutedContent>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
