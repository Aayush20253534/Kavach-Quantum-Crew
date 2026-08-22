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
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full appearance-none rounded-xl border border-slate-700/80 bg-[#0d1526] px-3.5 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            LeftIcon && 'pl-10',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" className="bg-[#0d1526] text-slate-400">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0d1526] text-slate-100">
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
