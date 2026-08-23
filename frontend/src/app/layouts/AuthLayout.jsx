import React from 'react';
import { Outlet } from 'react-router-dom';

import PrayagrajGallery from '../../features/auth/components/PrayagrajGallery';

export function AuthLayout() {
  return (
    <div className="fixed inset-0 w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden">
      {/* ------------------------------------------------
          LEFT HALF: PINTEREST-STYLE PRAYAGRAJ CAROUSEL
          DESKTOP ONLY
      ------------------------------------------------ */}
      <div className="hidden lg:block lg:w-[58%] xl:w-[62%] relative h-screen sticky top-0">
        <PrayagrajGallery />
      </div>

      {/* ------------------------------------------------
          RIGHT HALF: AUTHENTICATION PANEL
      ------------------------------------------------ */}
      <div className="flex-1 min-h-0 h-full flex flex-col relative z-20 bg-white text-slate-900 overflow-y-auto lg:overflow-hidden">
        {/* Center Form Container */}
        <div className="flex-1 min-h-0 flex flex-col justify-center w-full mx-auto relative z-0 h-full lg:overflow-hidden">
          <div className="mx-auto flex w-full max-w-[440px] flex-col px-6 sm:px-10 h-full justify-center">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}