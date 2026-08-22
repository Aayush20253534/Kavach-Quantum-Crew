import React from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Building2,
  Users,
  Radio,
  Activity,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';

export function AuthorityLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Live Command Map', path: '/authority/dashboard', icon: Activity },
    { name: 'Tourist Dashboard View', path: '/tourist/dashboard', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Authority Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <Link to="/authority/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#e11d48] flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[14px] font-black tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                PRAYAGRAJ <span className="text-[9px] px-1.5 py-0.5 rounded text-[#b91c1c] font-bold border border-[#fecaca] bg-[#fef2f2] uppercase">HQ</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Police & Tourism Command</p>
            </div>
          </Link>
        </div>

        {/* Live System Status Ticker */}
        <div className="p-4 mx-4 mt-5 rounded-md bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-[#e11d48] animate-pulse" />
              Dispatch Grid
            </span>
            <div className="text-[9px] py-0.5 px-2 bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] font-bold rounded uppercase tracking-wider">LIVE</div>
          </div>
          <div className="text-[11px] text-slate-600 space-y-1.5 pt-1 font-medium border-t border-slate-200 pt-3">
            <div className="flex justify-between items-center">
              <span>Active Tourists:</span>
              <span className="font-mono font-bold text-slate-900">12,480</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Patrol Units Deployed:</span>
              <span className="font-mono font-bold text-slate-900">64</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Open SOS Tickets:</span>
              <span className="font-mono font-bold text-[#e11d48]">2</span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Authority Controls</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${isActive
                    ? 'bg-[#fff1f2] text-[#be123c] border border-[#ffe4e6] shadow-sm'
                    : 'text-slate-600 border border-transparent hover:text-[#e11d48] hover:bg-slate-50 hover:border-slate-200'
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#e11d48]' : 'text-slate-400 group-hover:text-[#e11d48]'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-3 px-2 py-1 text-xs">
            <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-[14px]">
              HQ
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 truncate uppercase text-[12px] tracking-wide">Officer In-Charge</p>
              <p className="text-[10px] text-slate-500 font-bold truncate tracking-wider mt-0.5">Sangam Command Post</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#e11d48] hover:bg-[#fff1f2] transition-colors cursor-pointer border border-transparent hover:border-[#ffe4e6]"
          >
            <LogOut className="w-4 h-4 transition-colors text-slate-500 group-hover:text-[#e11d48]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-[#e11d48] text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              PRAYAGRAJ SECTOR 1-8 LIVE RADAR
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tourist/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors rounded-md shadow-sm cursor-pointer">
                Switch to Tourist App
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
