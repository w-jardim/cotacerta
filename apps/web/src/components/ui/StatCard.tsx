import type { ReactNode } from 'react';

interface StatCardProps {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  footnote?: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning';
}

export function StatCard({ icon, value, label, footnote, tone = 'neutral' }: StatCardProps) {
  const tones = {
    neutral: 'bg-white/90',
    brand: 'bg-gradient-to-br from-teal-50 via-white to-cyan-50',
    success: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
    warning: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
  };

  return (
    <div className={`cc-panel p-6 ${tones[tone]}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3">{icon}</div>
        <div>
          <p className="text-3xl font-extrabold text-slate-950">{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
      {footnote && <p className="mt-3 text-xs text-slate-500">{footnote}</p>}
    </div>
  );
}

export default StatCard;
