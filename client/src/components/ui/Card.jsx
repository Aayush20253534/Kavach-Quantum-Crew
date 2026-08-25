import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-[#0d1526]/90 border border-slate-800/80 shadow-xl shadow-black/40',
    elevated: 'bg-[#111c30] border border-slate-700/70 shadow-2xl shadow-black/60',
    glass: 'bg-[#0d1526]/70 backdrop-blur-xl border border-sky-500/20 shadow-xl',
    glow: 'bg-[#111c30] border border-sky-500/40 shadow-lg shadow-sky-500/10',
    danger: 'bg-red-950/20 border border-red-500/40 shadow-lg shadow-red-500/10',
  };

  return (
    <div
      className={cn('rounded-2xl transition-all duration-200', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pb-4 flex flex-col space-y-1.5 border-b border-slate-800/60', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs text-slate-400 font-normal leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pt-0 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  );
}
