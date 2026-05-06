import type { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbfb_0%,_#edf3f8_52%,_#f7f9fc_100%)]">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm backdrop-blur">
            Gestão profissional de caixinhas
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
            CotaCerta
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Controle caixinhas, cotistas e cobranças com uma experiência clara, segura e pronta para o dia a dia.
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
