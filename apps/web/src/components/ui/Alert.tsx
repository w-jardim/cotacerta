import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'info' | 'success';
  children: ReactNode;
}

export function Alert({ variant = 'info', children }: AlertProps) {
  const styles = {
    error: 'cc-alert border-red-200 bg-red-50 text-red-800',
    info: 'cc-alert border-sky-200 bg-sky-50 text-sky-800',
    success: 'cc-alert border-emerald-200 bg-emerald-50 text-emerald-800',
  };

  return <div className={styles[variant]}>{children}</div>;
}
