import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/auth-context';
import { Button } from '../ui/Button';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">CotaCerta</h1>
              <span className="text-sm text-slate-500">•</span>
              <span className="text-sm font-medium text-slate-700">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">
                  {user?.role === 'GESTOR_MASTER' ? 'Gestor Master' : user?.role}
                </p>
              </div>
              
              <Button variant="secondary" onClick={logout} className="px-4 py-2 text-xs">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
