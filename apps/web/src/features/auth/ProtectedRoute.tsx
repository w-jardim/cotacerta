import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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

  // Redirect COTISTA users away from the root/dashboard
  if (user?.role === 'COTISTA') {
    const path = window.location.pathname;
    if (!path.startsWith('/meu-painel')) {
      return <Navigate to="/meu-painel" replace />;
    }
  }

  return <>{children}</>;
}
