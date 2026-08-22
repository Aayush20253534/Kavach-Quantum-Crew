import React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef(({
  className,
  label,
  error,
  helperText,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        ref={ref}
        className={cn(
          'flex w-full rounded-xl border border-slate-700/80 bg-[#0d1526] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
