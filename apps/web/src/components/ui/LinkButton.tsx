import type { ButtonHTMLAttributes } from 'react';

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger';
}

export function LinkButton({ 
  children, 
  variant = 'default',
  className = '', 
  ...props 
}: LinkButtonProps) {
  const variants = {
    default: 'text-teal-700 hover:bg-teal-50 hover:text-teal-800',
    danger: 'text-rose-700 hover:bg-rose-50',
  };

  const baseStyles = variant === 'danger'
    ? 'w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors'
    : 'inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
