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

        {/* Center Form Container */}
        <div className="flex-1 flex flex-col justify-center w-full mx-auto relative z-0 h-full overflow-hidden">
          <div className="mx-auto flex w-full max-w-[440px] flex-col px-6 sm:px-10 h-full justify-center">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
