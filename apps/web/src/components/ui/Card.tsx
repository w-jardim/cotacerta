import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'subtle';
}

export function Card({
  children,
  className = '',
  variant = 'default',
  ...props
}: CardProps) {
  const variantClass = variant === 'subtle' ? 'cc-panel-subtle' : 'cc-panel';

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
