import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-colors
            placeholder:text-slate-400
            hover:border-slate-400
            focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
