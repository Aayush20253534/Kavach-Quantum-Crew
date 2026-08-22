import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, HeartHandshake, PhoneCall } from 'lucide-react';
import PrayagrajGallery from '../../features/auth/components/PrayagrajGallery';

export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* ------------------------------------------------
          LEFT HALF: PINTEREST-STYLE PRAYAGRAJ CAROUSEL (DESKTOP)
      ------------------------------------------------ */}
      <div className="hidden lg:block lg:w-[58%] xl:w-[62%] relative h-screen sticky top-0">
        <PrayagrajGallery />
      </div>

      {/* ------------------------------------------------
          RIGHT HALF: AUTHENTICATION (LOGIN / REGISTER) PANEL
      ------------------------------------------------ */}
      <div className="flex-1 min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-10 relative z-20 bg-slate-50 lg:border-l lg:border-slate-200">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Row */}
        <div className="flex items-center justify-between z-20 pb-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm backdrop-blur-md transition-all hover:bg-slate-50 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 text-sky-600" />
            Back to Home
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="hidden sm:inline">Emergency Helpline:</span>
            <a
              href="tel:112"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 font-bold hover:bg-red-100 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              112 / 1363
            </a>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6 relative z-10">
          <Outlet />
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 text-center text-xs text-slate-500 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 border-t border-slate-200">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            End-to-End Encrypted Safety Network
          </p>
          <p className="flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-sky-600" />
            Prayagraj Smart Tourism & SIH 2026
          </p>
        </div>
      </div>
    </div>
  );
}
