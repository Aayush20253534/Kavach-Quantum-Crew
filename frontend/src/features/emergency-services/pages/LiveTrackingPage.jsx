import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, Navigation, Signal } from 'lucide-react';

export function LiveTrackingPage() {
  const { theme } = useOutletContext();
  const ThemeIcon = theme.icon;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className={`p-6 rounded-2xl ${theme.bgClass} text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MapPin className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 animate-bounce" /> Live Tracking
            </h1>
            <p className="text-white/80 font-medium text-sm mt-1">
              Sharing precise fleet location with Command Center and Incident Reporter.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/20">
            <Signal className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">GPS Active</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="w-full h-[500px] bg-slate-50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Mock Map Background Grid */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-700">
            <div className={`w-20 h-20 rounded-full ${theme.lightBgClass} flex items-center justify-center mb-6 relative shadow-2xl ring-4 ring-white`}>
              <div className={`absolute -inset-4 rounded-full ${theme.bgClass} opacity-20 animate-ping`} style={{ animationDuration: '2s' }}></div>
              <div className={`absolute -inset-8 rounded-full ${theme.bgClass} opacity-10 animate-ping`} style={{ animationDuration: '3s' }}></div>
              <ThemeIcon className={`w-10 h-10 ${theme.textClass}`} />
            </div>
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold shadow-2xl flex items-center gap-2 uppercase tracking-widest border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Transmitting Location
            </div>
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center max-w-[250px] leading-relaxed">
              Updates are being pushed via WebSockets to the Command Center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
