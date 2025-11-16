import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { loading, session } = useAuth();
  if (loading) return null; // or spinner
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RoleRoute({ allow }: { allow: Array<'admin' | 'user'> }) {
  const { loading, profile } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  return allow.includes(profile.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
