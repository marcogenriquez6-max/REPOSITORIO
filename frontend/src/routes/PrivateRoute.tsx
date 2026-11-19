import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: Role[] }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (roles && (!user || !roles.includes(user.role))) return <Navigate to="/" replace />;
  return children;
}
