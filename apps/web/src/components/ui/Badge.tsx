import type { ReactNode } from 'react';

interface BadgeProps {
  status?: string;
  children?: ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  const map: Record<string, string> = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    BLOCKED: 'border-amber-200 bg-amber-50 text-amber-700',
    INACTIVE: 'border-slate-200 bg-slate-100 text-slate-700',
    PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
    CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
    ARCHIVED: 'border-rose-200 bg-rose-50 text-rose-700',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PARTIAL: 'border-sky-200 bg-sky-50 text-sky-700',
    OVERDUE: 'border-rose-200 bg-rose-50 text-rose-700',
    CANCELED: 'border-slate-200 bg-slate-100 text-slate-700',
  };

  const cls = status ? map[status] || 'border-slate-200 bg-slate-100 text-slate-800' : 'border-slate-200 bg-slate-100 text-slate-800';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children || status}
    </span>
  );
}

export default Badge;
