import React from 'react';
import { cn } from '../../lib/utils';
import { ShieldCheck, AlertTriangle, AlertCircle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';

export function Badge({
  className,
  variant = 'default',
  showDot = true,
  icon = true,
  children,
  ...props
}) {
  const variants = {
    // Risk semantic indicators
    low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    safe: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    high: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    critical: 'bg-red-500/15 text-red-400 border border-red-500/40 animate-pulse',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/40',
    
    // Status indicators
    primary: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
    default: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  const dots = {
    low: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    safe: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    medium: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    warning: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    high: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]',
    critical: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping',
    danger: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]',
    primary: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
    indigo: 'bg-indigo-400',
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dots[variant])} />
      )}
      {children}
    </span>
  );
}
