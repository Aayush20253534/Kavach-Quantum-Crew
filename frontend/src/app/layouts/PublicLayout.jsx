import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, PhoneCall, ArrowRight, Globe, Lock, Radio } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#060B16] text-slate-100 selection:bg-sky-500/30">
      {/* Top Emergency Announcement Ribbon */}
      <div className="bg-gradient-to-r from-red-600/90 via-rose-600/90 to-red-700/90 py-1.5 px-4 text-center text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-md">
        <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
        <span>Prayagraj Tourist Command Center Active · Emergency Helpline <strong>112</strong> / Tourist Police <strong>1363</strong></span>
      </div>

      {/* Main Glass Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060B16]/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                KAVACH <span className="text-sky-400 font-medium text-xs px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">Prayagraj</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Smart Tourist Safety Platform</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-sky-400 transition-colors">Safety Features</a>
            <a href="#safe-zones" className="hover:text-sky-400 transition-colors">Geo-Safe Zones</a>
            <a href="#helplines" className="hover:text-sky-400 transition-colors">Emergency Contacts</a>
            <a href="#about" className="hover:text-sky-400 transition-colors">About Protocol</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Comprehensive Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080d18] mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">KAVACH SAFETY</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Next-generation IoT & AI enabled tourist safety network for Prayagraj pilgrimage and tourism. Safeguarding every step with real-time location monitoring and rapid SOS response.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Integrated with UP Police Command 112
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Quick Navigation</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-sky-400 transition">Tourist Portal Login</Link></li>
                <li><Link to="/register" className="hover:text-sky-400 transition">Create Safety ID</Link></li>
                <li><Link to="/tourist/dashboard" className="hover:text-sky-400 transition">Live Tourist Dashboard</Link></li>
                <li><Link to="/authority/dashboard" className="hover:text-sky-400 transition">Authority Command Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Prayagraj Safe Zones</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>Triveni Sangam & Ghats (Sector 1-8)</li>
                <li>Allahabad Fort & Akshayavat</li>
                <li>Anand Bhavan & Swaraj Bhavan</li>
                <li>Civil Lines Assistance Hub</li>
                <li>Prayagraj Junction Police Post</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">24/7 Emergency Hotlines</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/20 flex justify-between items-center text-slate-200">
                  <span>National Police:</span>
                  <a href="tel:112" className="font-bold text-red-400 hover:underline">112</a>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/20 flex justify-between items-center text-slate-200">
                  <span>Tourist Helpline:</span>
                  <a href="tel:1363" className="font-bold text-sky-400 hover:underline">1363</a>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex justify-between items-center text-slate-200">
                  <span>Women Safety (1090):</span>
                  <a href="tel:1090" className="font-bold text-amber-400 hover:underline">1090</a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Kavach Tourist Safety Initiative. Smart India Hackathon.</p>
            <div className="flex gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Protocol</span>
              <span className="hover:text-slate-400 cursor-pointer">Emergency Terms</span>
              <span className="hover:text-slate-400 cursor-pointer">Blockchain Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
