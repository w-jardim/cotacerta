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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}
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
