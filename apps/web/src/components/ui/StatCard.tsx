import type { ReactNode } from 'react';

interface StatCardProps {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  footnote?: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
}

export function StatCard({ value, label, footnote, tone = 'neutral' }: StatCardProps) {
  const accent = {
    neutral: 'border-l-slate-300',
    brand: 'border-l-teal-500',
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    danger: 'border-l-rose-500',
  };

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${accent[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {footnote && <p className="mt-1 text-xs text-slate-500">{footnote}</p>}
    </div>
  );
}

export default StatCard;
