import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Building2,
  Users,
  Radio,
  Activity,
  LogOut,
  Menu,
  ChevronLeft,
  AlertTriangle,
  Car,
  Map,
  ShieldAlert,
  Users2,
  BarChart4,
  UserPlus
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';
import { authService } from '../../features/auth/api/authService';
import { markExplicitSignOut } from '../../services/apiClient';
import { SignOutConfirmModal } from '../components/SignOutConfirmModal';
import { authorityService } from '../../features/authority/api/authorityService';

export function AuthorityLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [jurisdictionOverview, setJurisdictionOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authorityService.getJurisdictionOverview()
      .then((data) => {
        if (!cancelled) setJurisdictionOverview(data);
      })
      .catch(() => {
        if (!cancelled) setJurisdictionOverview(null);
      });

    return () => { cancelled = true; };
  }, []);

  const jurisdiction = jurisdictionOverview?.responder?.jurisdiction || 'Assigned Area';
  const commandStats = jurisdictionOverview?.stats || {};

  const handleLogout = async () => {
    setLogoutBusy(true);
    // Record the user's intent before any network request so a reload cannot
    // resurrect the session while logout is in flight or if it fails.
    markExplicitSignOut();
    try {
      // Revoke the server-side refresh session and clear the refresh cookie.
      // Without this, a later page refresh can silently authenticate the user again.
      await authService.logout();
    } catch {
      // Local sign-out must still complete if the network is unavailable.
    } finally {
      dispatch(logout());
      setLogoutBusy(false);
      setLogoutOpen(false);
      navigate('/', { replace: true });
    }
  };

  const requestLogout = () => setLogoutOpen(true);

  const navItems = [
    { name: 'Live Command Map', path: '/authority/dashboard', icon: Activity },
    { name: 'Incident Queue', path: '/authority/incidents', icon: AlertTriangle },
    { name: 'Fleet Dispatch', path: '/authority/dispatch', icon: Car },
    { name: 'Account Creation', path: '/authority/accounts/create', icon: UserPlus },
    { name: 'Risk Zones', path: '/authority/zones', icon: Map },
    { name: 'Analytics', path: '/authority/analytics', icon: BarChart4 },
  ];

  return (
    <>
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
      <div className="min-h-screen bg-slate-100 text-slate-900 antialiased font-sans">

      {/* Authority Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#07111f] border-r border-slate-800 fixed top-0 left-0 h-screen z-30 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'}`}>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#0b1728] border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-sm z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Header */}
        <div className={`p-5 border-b border-slate-800 flex items-center bg-[#07111f] ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link to="/authority/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#e11d48] flex items-center justify-center text-white shadow-sm shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[14px] font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                  {jurisdiction.toUpperCase()} <span className="text-[9px] px-1.5 py-0.5 rounded text-[#b91c1c] font-bold border border-[#fecaca] bg-[#fef2f2] uppercase">HQ</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Disaster Management Command</p>
              </div>
            </Link>
          ) : (
            <Link to="/authority/dashboard" className="w-10 h-10 rounded-md bg-[#e11d48] flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Live System Status Ticker */}
        {!isCollapsed && (
          <div className="p-4 mx-4 mt-5 rounded-md bg-[#0b1728] border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Radio className="w-4 h-4 text-[#e11d48] animate-pulse" />
                Command Network
              </span>
              <div className="text-[9px] py-0.5 px-2 bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] font-bold rounded uppercase tracking-wider">LIVE</div>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1.5 pt-1 font-medium border-t border-slate-700 pt-3">
              <div className="flex justify-between items-center">
                <span>Active Tourists:</span>
                <span className="font-mono font-bold text-white">{commandStats.activeTourists ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Emergency Units:</span>
                <span className="font-mono font-bold text-white">{commandStats.emergencyUnits?.filter((unit) => unit.status !== "OUT_OF_SERVICE").length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Incidents:</span>
                <span className="font-mono font-bold text-[#e11d48]">{commandStats.openIncidents ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className={`flex-1 min-h-0 overflow-y-auto overscroll-contain py-5 space-y-1.5 ${isCollapsed ? 'px-3 mt-4' : 'px-4'}`}>
          <p className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : ''}`}>
            {isCollapsed ? 'CTRL' : 'Command Operations'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${location.pathname.startsWith(item.path)
                    ? 'bg-[#fff1f2] text-[#be123c] border border-[#ffe4e6] shadow-sm'
                    : 'text-slate-400 border border-transparent hover:text-white hover:bg-[#0b1728] hover:border-slate-700'
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${location.pathname.startsWith(item.path) ? 'text-[#e11d48]' : 'text-slate-400 group-hover:text-[#e11d48]'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-slate-800 bg-[#07111f] space-y-3 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1 text-xs">
              <div className="w-10 h-10 rounded-md bg-[#0b1728] border border-slate-700 flex items-center justify-center font-black text-slate-700 text-[14px]">
                HQ
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate uppercase text-[11px] tracking-wide">{jurisdictionOverview?.responder?.name || user?.name || "Officer In-Charge"}</p>
                <p className="text-[9px] text-slate-400 font-bold truncate tracking-wider mt-0.5">{jurisdiction}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-md bg-[#0b1728] border border-slate-700 flex items-center justify-center font-black text-slate-700 text-[14px]" title="Officer In-Charge">
                HQ
              </div>
            </div>
          )}

          <button
            onClick={requestLogout}
            className={`group w-full flex items-center gap-2 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-[#0b1728] transition-colors cursor-pointer border border-transparent hover:border-[#ffe4e6] ${isCollapsed ? 'justify-center px-0' : 'justify-center'}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 transition-colors text-slate-500 group-hover:text-[#e11d48]" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 md:pl-64 ${isCollapsed ? 'md:pl-20' : ''}`}>
        <header className={`fixed top-0 right-0 z-20 h-16 bg-[#081321]/95 backdrop-blur-xl border-b border-slate-800 px-4 md:px-6 flex items-center justify-between transition-all duration-300 w-full ${isCollapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-16rem)]'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-[#e11d48] text-white text-[10px] font-bold px-2 py-1.5 md:px-3 md:py-1.5 uppercase tracking-widest rounded shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">{jurisdiction.toUpperCase()} LIVE MAP</span>
              <span className="sm:hidden">LIVE MAP</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 md:p-6 pb-24 mt-16 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-[#07111f] border-t border-slate-800 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 w-20 h-full ${isActive ? 'text-[#fb7185]' : 'text-slate-500 hover:text-white'}`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold text-center leading-tight px-1 ${isActive ? 'text-[#fb7185]' : 'text-slate-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
    </>
  );
}
