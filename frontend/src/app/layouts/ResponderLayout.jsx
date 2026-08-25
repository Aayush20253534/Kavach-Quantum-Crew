import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShieldAlert,
  Flame,
  Ambulance,
  Radio,
  MapPin,
  History,
  LogOut,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';
import { authService } from '../../features/auth/api/authService';
import { markExplicitSignOut } from '../../services/apiClient';
import { SignOutConfirmModal } from '../components/SignOutConfirmModal';

export function ResponderLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLabel = now.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' });

  const handleLogout = async () => {
    setLogoutBusy(true);
    markExplicitSignOut();
    localStorage.removeItem('DEV_ROLE');
    try {
      await authService.logout();
    } catch {
    } finally {
      dispatch(logout());
      setLogoutBusy(false);
      setLogoutOpen(false);
      navigate('/', { replace: true });
    }
  };

  const getTheme = () => {
    switch (user?.role) {
      case 'POLICE':
        return {
          color: 'amber',
          textClass: 'text-amber-700',
          bgClass: 'bg-amber-600',
          lightBgClass: 'bg-amber-50',
          borderClass: 'border-amber-200',
          icon: ShieldAlert,
          label: 'Police Dispatch'
        };
      case 'FIRE':
        return {
          color: 'red',
          textClass: 'text-red-600',
          bgClass: 'bg-red-600',
          lightBgClass: 'bg-red-50',
          borderClass: 'border-red-200',
          icon: Flame,
          label: 'Fire Dispatch'
        };
      case 'AMBULANCE':
        return {
          color: 'emerald',
          textClass: 'text-emerald-600',
          bgClass: 'bg-emerald-600',
          lightBgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-200',
          icon: Ambulance,
          label: 'Ambulance Dispatch'
        };
      default:
        return {
          color: 'indigo',
          textClass: 'text-indigo-600',
          bgClass: 'bg-indigo-600',
          lightBgClass: 'bg-indigo-50',
          borderClass: 'border-indigo-200',
          icon: Radio,
          label: 'Responder'
        };
    }
  };

  const theme = getTheme();
  const ThemeIcon = theme.icon;

  const navItems = [
    { name: 'Active Dispatch', path: '/responder/dispatch', icon: Radio },
    { name: 'Live Tracking', path: '/responder/tracking', icon: MapPin },
    { name: 'History', path: '/responder/history', icon: History },
  ];

  const userName = user?.organization || user?.name || 'Responder Unit';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 antialiased relative">
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleLogout}
      />

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className={`p-6 pb-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-xl ${theme.lightBgClass} ${theme.textClass}`}>
                <ThemeIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[15px] font-black tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                  KAVACH
                </h1>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${theme.textClass}`}>{theme.label}</p>
              </div>
            </div>
          ) : (
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-xl ${theme.lightBgClass} ${theme.textClass}`}>
              <ThemeIcon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-8">
          <div className={`space-y-1 ${isCollapsed ? 'px-3' : 'px-6'}`}>
            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : 'pl-2'}`}>
              {isCollapsed ? 'MENU' : 'Main Menu'}
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 rounded-xl text-[12px] font-bold transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
                    isActive
                      ? `${theme.lightBgClass} ${theme.textClass} relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:${theme.bgClass} after:rounded-r-full`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        <div className={`pt-4 border-t border-slate-100 bg-white space-y-4 ${isCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={() => setLogoutOpen(true)}
            className={`w-full flex items-center gap-2 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN APPLICATION AREA */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-[280px]'}`}>
        
        <header className={`fixed top-0 right-0 z-[60] h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 w-full ${isCollapsed ? 'lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-280px)]'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${theme.lightBgClass} flex items-center justify-center shrink-0`}>
              <ThemeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textClass}`} />
            </div>
            <div>
              <p className="text-[12px] sm:text-[14px] font-bold text-slate-900 tracking-tight uppercase">
                {theme.label}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-[13px] font-black text-slate-900">{timeLabel}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dateLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 border border-slate-200">
                {initial}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">{userName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 mt-16 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          <Outlet context={{ theme }} />
        </main>
      </div>
    </div>
  );
}
