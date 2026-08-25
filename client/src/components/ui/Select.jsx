import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  className,
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  leftIcon: LeftIcon,
  children,
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
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full appearance-none rounded-xl border px-3.5 py-2 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            variant === 'light' 
              ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/20'
              : 'border-slate-700/80 bg-[#0d1526] text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20',
            LeftIcon && 'pl-10',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" className={variant === 'light' ? "bg-white text-slate-400" : "bg-[#0d1526] text-slate-400"}>{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className={variant === 'light' ? "bg-white text-slate-900" : "bg-[#0d1526] text-slate-100"}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="absolute right-3.5 w-4 h-4 pointer-events-none text-slate-400" />
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

Select.displayName = 'Select';
