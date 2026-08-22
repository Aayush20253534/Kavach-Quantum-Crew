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
          RIGHT HALF: AUTHENTICATION PANEL (WHITE DESIGN)
      ------------------------------------------------ */}
      <div className="flex-1 h-screen flex flex-col relative z-20 bg-white text-slate-900 overflow-hidden">
        {/* Top Bar (Language Selector) */}
        <div className="flex shrink-0 justify-end px-6 py-4 sm:px-10 absolute top-0 right-0 w-full z-10 bg-white">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            English
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        {/* Center Form Container */}
        <div className="flex-1 flex flex-col justify-center w-full mx-auto relative z-0 h-full overflow-hidden pt-12">
          <div className="mx-auto flex w-full max-w-[440px] flex-col px-6 sm:px-10 h-full justify-center">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
