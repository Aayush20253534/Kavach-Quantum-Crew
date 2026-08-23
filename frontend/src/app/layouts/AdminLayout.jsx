import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  ExternalLink,
  Settings,
  FileText,
  ChevronLeft,
  Puzzle,
  LayoutDashboard,
  MapPinned
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';

export function AdminLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Destinations', path: '/admin/locations', icon: MapPinned },
    { name: 'Danger Zones', path: '/admin/zones', icon: ShieldCheck },
    { name: 'Accounts', path: '/admin/accounts', icon: Users },
    { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
    { name: 'Integrations', path: '/admin/integrations', icon: Puzzle },
    { name: 'Background Sweeps', path: '/admin/jobs', icon: Activity },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Tourist View', path: '/tourist/dashboard', icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* Authority Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        
        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Header */}
        <div className={`p-6 border-b border-slate-200 flex items-center bg-white ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[14px] font-black tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                  PLATFORM <span className="text-[9px] px-1.5 py-0.5 rounded text-indigo-700 font-bold border border-indigo-200 bg-indigo-50 uppercase">ADMIN</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Core Infrastructure</p>
              </div>
            </Link>
          ) : (
            <Link to="/admin/dashboard" className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className={`flex-1 py-6 space-y-2 ${isCollapsed ? 'px-3 mt-4' : 'px-4'}`}>
          <p className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : ''}`}>
            {isCollapsed ? 'SYS' : 'System Administration'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 py-3 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                    : 'text-slate-600 border border-transparent hover:text-indigo-600 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-slate-200 bg-white space-y-3 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1 text-xs">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-[14px]">
                HQ
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate uppercase text-[12px] tracking-wide">
                  {user?.name || user?.username || 'System Administrator'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold truncate tracking-wider mt-0.5">
                  {user?.email || 'Platform Operations'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-[14px]" title="Root Admin">
                HQ
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center gap-2 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-100 ${isCollapsed ? 'justify-center px-0' : 'justify-center'}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 transition-colors text-slate-500 group-hover:text-indigo-600" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 md:pl-72 ${isCollapsed ? 'md:pl-20' : ''}`}>
        <header className={`fixed top-0 right-0 z-20 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm transition-all duration-300 w-full ${isCollapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-18rem)]'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1.5 md:px-3 md:py-1.5 uppercase tracking-widest rounded shadow-sm flex items-center gap-2">
              <span className="hidden sm:inline">QUANTUM CREW SYSADMIN</span>
              <span className="sm:hidden">SYSADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/tourist/dashboard">
              <button className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-slate-900 text-white text-[9px] md:text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors rounded-md shadow-sm cursor-pointer">
                <span className="hidden sm:inline">Switch to Tourist App</span>
                <span className="sm:hidden">Tourist App</span>
                <ExternalLink className="w-3.5 h-3.5 hidden sm:block" />
              </button>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-rose-600"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 mt-16 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex flex-col items-center justify-center gap-1 w-20 h-full ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold text-center leading-tight px-1 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
