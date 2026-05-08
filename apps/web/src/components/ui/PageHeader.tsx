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
    <div className="space-y-2">
      {backTo && <BackButton to={backTo} label={backLabel} />}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export default PageHeader;
