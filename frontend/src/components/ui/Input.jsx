import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  variant = 'dark',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className={cn(
          "block text-xs font-semibold tracking-wide",
          variant === 'light' ? "text-slate-700" : "text-slate-300"
        )}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className={cn(
            "absolute left-3.5 pointer-events-none",
            variant === 'light' ? "text-slate-400" : "text-slate-400"
          )}>
            <LeftIcon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border px-3.5 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'light' 
              ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
              : 'border-slate-700/80 bg-[#0d1526] text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20',
            LeftIcon && 'pl-10',
            RightIcon && 'pr-10',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 text-red-500',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3.5 text-slate-400">
            {typeof RightIcon === 'function' ? <RightIcon className="w-4 h-4" /> : RightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
