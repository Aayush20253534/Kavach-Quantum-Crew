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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f8f9fa] overflow-hidden">

      {/* Ambient Pulsing Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-400/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6">

        {/* Core Holographic Scanner Group */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-10">

          {/* Outer Radar Sweep */}
          <div className="absolute inset-0 rounded-full border border-red-200/40"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-red-500 shadow-[0_-4px_10px_rgba(225,29,72,0.2)] animate-spin" style={{ animationDuration: '2s' }}></div>

          {/* Middle Dotted Track */}
          <div className="absolute inset-5 rounded-full border-[1.5px] border-dashed border-slate-300/80 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>

          {/* Inner Highlight Ring */}
          <div className="absolute inset-9 rounded-full border border-transparent border-r-red-400/60 animate-spin" style={{ animationDuration: '3s' }}></div>

          {/* Solid White Glowing Core */}
          <div className="absolute inset-12 bg-white rounded-full shadow-[0_8px_30px_rgba(225,29,72,0.15)] flex items-center justify-center border border-red-50 z-10">
            <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-tr from-red-50/50 to-white rounded-full">
              <ShieldCheck className="w-8 h-8 text-red-600 drop-shadow-sm animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>

        {/* Text & Branding Presentation */}
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              Kavach
              <span className="bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded-md tracking-widest font-bold uppercase shadow-sm">
                OS
              </span>
            </h2>
          </div>

          {/* Status Bar Indicator */}
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm w-max justify-center">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-widest">
              {message}
            </p>
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