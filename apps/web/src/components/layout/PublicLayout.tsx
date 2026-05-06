import type { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            CotaCerta
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestão profissional de caixinhas coletivas
          </p>
        </div>
        
        <div className="w-full max-w-md">
          {children}
        </div>
        
        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} CotaCerta. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
