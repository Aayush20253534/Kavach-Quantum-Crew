import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShieldCheck,
  LayoutDashboard,
  MapPin,
  Compass,
  Users,
  AlertTriangle,
  User,
  LogOut,
  Bell,
  Clock,
  Phone,
  ChevronDown,
  Navigation,
  FileText,
  PlusCircle,
  History
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';

export function TouristLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/tourist/dashboard', icon: LayoutDashboard },
    { name: 'Live Tracking', path: '/tourist/tracking', icon: Navigation },
    { name: 'My Trips', path: '/tourist/trips/current', icon: Compass },
    { name: 'Groups & QR', path: '/tourist/groups/create', icon: Users },
    { name: 'Report Incident', path: '/tourist/incidents/report', icon: AlertTriangle },
    { name: 'Safety ID Profile', path: '/tourist/profile', icon: User },
  ];

  const tripTools = [
    { name: 'Plan New Trip', path: '/tourist/trips/create', icon: PlusCircle },
    { name: 'Trip History', path: '/tourist/trips/history', icon: History },
  ];

  const userName = user?.name || 'Aayansh Niranjan';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-slate-900 antialiased font-sans">

      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside className="hidden lg:flex w-[280px] flex-col bg-white border-r border-slate-200 sticky top-0 h-screen z-30">

        {/* Brand Header */}
        <div className="p-6 pb-2">
          <Link to="/tourist/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f2c] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[15px] font-black tracking-tight text-[#1a1f2c] flex items-center gap-2">
                KAVACH
                <span className="text-[9px] px-1.5 py-0.5 rounded text-red-600 font-bold bg-red-50 uppercase tracking-wider">Tourist</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Safety Network</p>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="px-6 py-4">
          <div className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-900 truncate uppercase tracking-wide">{userName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">ID: #DTD-PRY-8924</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Status</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></div>
                <span className="text-[9px] font-bold uppercase tracking-wider">Safe Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="px-6 space-y-1 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">Main Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              // For Dashboard, we want exact match since /tourist/tracking etc are also under /tourist
              const isActive = item.path === '/tourist/dashboard'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all ${isActive
                    ? 'bg-red-50 text-red-600 relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-red-600 after:rounded-r-full'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="px-6 space-y-1 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">Trip Tools</p>
            {tripTools.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all ${isActive
                    ? 'bg-red-50 text-red-600 relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-red-600 after:rounded-r-full'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-white space-y-4">
          <button className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white py-3.5 px-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 cursor-pointer">
            <Phone className="w-4 h-4" />
            SOS EMERGENCY
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN APPLICATION AREA
      ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">

          {/* Left: Location */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="text-[13px] font-black text-slate-900 uppercase tracking-wide group-hover:text-red-600 transition-colors">
                  SANGAM SECTOR 4, PRAYAGRAJ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">25.4358° N, 81.8463° E</p>
            </div>
          </div>

          {/* Middle: Time & Date */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-[13px] font-black text-slate-900">10:24 AM</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">23 May 2025, Friday</p>
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex bg-[#e11d48] hover:bg-[#be123c] text-white px-6 py-2.5 rounded-xl font-bold text-[13px] tracking-wide items-center justify-center gap-2 shadow-[0_4px_10px_0_rgba(225,29,72,0.2)] transition-all active:scale-95 cursor-pointer">
              <Phone className="w-4 h-4" />
              SOS
            </button>

            <button className="relative w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-300 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e11d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                3
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 border border-slate-200 group-hover:border-slate-300 transition-colors">
                {initial}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">{userName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
