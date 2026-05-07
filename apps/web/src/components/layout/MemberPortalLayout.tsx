import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { Button } from '../ui/Button';

interface MemberPortalLayoutProps {
  children: ReactNode;
}

export function MemberPortalLayout({ children }: MemberPortalLayoutProps) {
  const { user, logout } = useAuth();

  const links = [
    { to: '/meu-painel', label: 'Meu Painel', end: true },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.1),_transparent_24%),linear-gradient(180deg,_#f8fbfb_0%,_#eff4f8_55%,_#f7f9fc_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                  CotaCerta
                </p>
                <h1 className="text-xl font-extrabold text-slate-950">
                  Painel do cotista
                </h1>
              </div>

              <nav className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-slate-950 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-right shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">Cotista</p>
              </div>

              <Button
                variant="secondary"
                onClick={logout}
                className="px-4 py-2.5 text-xs"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
