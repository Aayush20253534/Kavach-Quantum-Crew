import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPinOff, ArrowLeft, Home, Compass } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 text-slate-200/50">
        <Compass className="w-64 h-64 animate-spin-slow" style={{ animationDuration: '60s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-red-100 border-2 border-red-200 flex items-center justify-center text-red-500 mb-6 shadow-sm shadow-red-500/10">
          <MapPinOff className="w-12 h-12" />
        </div>
        
        <h1 className="text-7xl font-black tracking-tight text-slate-900 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Destination Not Found</h2>
        
        <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
          The safety portal route you requested does not exist or has been relocated within the Prayagraj grid. Let's get you back on the safe path.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link 
            to="/"
            className="group flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#e33636] to-red-600 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:scale-105 hover:shadow-red-500/40 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
      
      {/* Bottom Branding */}
      <div className="absolute bottom-8 text-center w-full">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400">
          Quantum-Crew · Kavach Safety
        </p>
      </div>
    </div>
  );
}
