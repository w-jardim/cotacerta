import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

interface CotistaRouteProps {
  children: ReactNode;
}

/** Allows only COTISTA role. Redirects GESTOR_MASTER to /dashboard. */
export function CotistaRoute({ children }: CotistaRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'COTISTA') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
