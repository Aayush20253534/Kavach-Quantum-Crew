import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export function PublicLayout() {
  const location = useLocation();

  // If we are on the homepage, the background should be transparent/floating over the image
  // For other pages (like login/register), it could have a slight background
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#060B16] text-white selection:bg-sky-500/30">

      {/* Floating Premium Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${isHome ? 'pt-6 px-6' : 'bg-[#060B16]/90 backdrop-blur-xl border-b border-white/5 py-4 px-6'}`}>
        <div className={`mx-auto max-w-[1400px] flex items-center justify-between transition-all duration-300 ${isHome ? 'bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : ''}`}>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-black tracking-[0.15em] text-white leading-none">
                KAVACH
              </span>
              <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/50 leading-none mt-1">
                Tourist Safety Network
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#safe-zones" className="text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Safe Zones</a>
            <a href="#emergency" className="text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Emergency</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-widest text-white/80 hover:text-white transition-colors hidden sm:block">
              Sign In
            </Link>

            <Link to="/register" className="group relative overflow-hidden rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(244,63,94,0.3)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(244,63,94,0.5)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
              <span className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_0.8s_ease-in-out]" />
              <span>Create Account</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      {!isHome && (
        <footer className="border-t border-white/5 bg-[#060B16] mt-auto py-8">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-white/40">
            <p>© {new Date().getFullYear()} Kavach Tourist Safety Initiative.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-white/70 cursor-pointer transition-colors">Privacy Protocol</span>
              <span className="hover:text-white/70 cursor-pointer transition-colors">Emergency Terms</span>
            </div>
          </div>
        </footer>
      )}

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
      `}} />
    </div>
  );
}
