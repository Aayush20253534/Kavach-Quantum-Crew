import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Loader({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 
      className={cn("animate-spin text-sky-400", sizes[size], className)} 
    />
  );
}

export function FullPageLoader({ message = 'Securing session & safety protocols...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060B16] text-white p-4 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-sky-400 animate-pulse" />
        </div>
        <Loader2 className="w-20 h-20 text-sky-500/40 animate-spin absolute -inset-2" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-slate-100 tracking-wide">KAVACH SAFETY</h3>
        <p className="text-xs text-slate-400 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("p-6 rounded-2xl bg-[#0d1526] border border-slate-800 animate-pulse space-y-4", className)}>
      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
      <div className="h-3 bg-slate-800/60 rounded w-3/4"></div>
      <div className="h-24 bg-slate-800/40 rounded-xl"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-[#0d1526] border border-slate-800/60 animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-800 rounded w-1/4"></div>
            <div className="h-2.5 bg-slate-800/60 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
