import React from 'react';
import { ShieldCheck, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Loader({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-red-100/50"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600 animate-spin" style={{ animationDuration: '0.7s' }}></div>
    </div>
  );
}

export function FullPageLoader({ message = 'Securing session...' }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-50 px-6">
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        {/* Compact concentric KAVACH scanner. The rings use different speeds so
            the loader feels intentional without becoming visual noise. */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-slate-200 bg-white/70 shadow-[0_18px_55px_rgba(15,23,42,0.08)]" />

          <div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-red-600 border-r-red-200 animate-spin"
            style={{ animationDuration: '1.15s' }}
          />

          <div
            className="absolute inset-5 rounded-full border border-dashed border-slate-300 animate-spin"
            style={{ animationDuration: '5.5s', animationDirection: 'reverse' }}
          />

          <div
            className="absolute inset-8 rounded-full border-2 border-transparent border-b-slate-900 border-l-slate-300 animate-spin"
            style={{ animationDuration: '1.9s' }}
          />

          <div className="absolute inset-[46px] rounded-full border border-slate-200 bg-white shadow-sm" />
          <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <span className="absolute left-[14px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-600 shadow-[0_0_0_5px_rgba(225,29,72,0.08)] animate-pulse" />
          <span
            className="absolute right-[20px] top-[25px] h-1.5 w-1.5 rounded-full bg-slate-700 animate-pulse"
            style={{ animationDelay: '350ms' }}
          />
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-black tracking-tight text-slate-950">KAVACH</span>
            <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">
              Safety Network
            </span>
          </div>

          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {message}
          </p>

          <div className="mx-auto mt-4 h-1 w-32 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-slate-900 to-red-600 animate-[pulse_1.2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm relative overflow-hidden", className)}>
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-50/50 to-transparent animate-[shimmer_1.5s_infinite]"></div>

      <div className="space-y-4 relative z-10 animate-pulse">
        <div className="h-4 bg-slate-100 rounded-md w-1/3"></div>
        <div className="h-3 bg-slate-50 rounded-md w-3/4"></div>
        <div className="h-28 bg-slate-50/80 rounded-xl border border-slate-100/50"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-50/50 to-transparent animate-[shimmer_1.5s_infinite]"></div>

          <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
          <div className="flex-1 space-y-2.5 animate-pulse">
            <div className="h-3.5 bg-slate-100 rounded-md w-1/4"></div>
            <div className="h-2.5 bg-slate-50 rounded-md w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}