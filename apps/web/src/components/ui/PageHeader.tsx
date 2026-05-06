import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, backTo, backLabel }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backTo && <BackButton to={backTo} label={backLabel} />}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-950">{title}</h1>
        {subtitle && <p className="max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
}

export default PageHeader;
