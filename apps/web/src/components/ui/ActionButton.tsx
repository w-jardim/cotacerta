import type { ButtonHTMLAttributes } from 'react';

type ActionButtonVariant = 'primary' | 'success' | 'warning' | 'danger';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
}

export function ActionButton({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ActionButtonProps) {
  const variants: Record<ActionButtonVariant, string> = {
    primary: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
