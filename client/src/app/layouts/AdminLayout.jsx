import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  ShieldCheck,
  LogOut,
  FileText,
  ChevronLeft,
  LayoutDashboard,
  MapPinned
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';
import { authService } from '../../features/auth/api/authService';
import { markExplicitSignOut } from '../../services/apiClient';
import { SignOutConfirmModal } from '../components/SignOutConfirmModal';

export function AdminLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

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
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Destinations', path: '/admin/locations', icon: MapPinned },
    { name: 'Danger Zones', path: '/admin/zones', icon: ShieldCheck },
    { name: 'Accounts', path: '/admin/accounts', icon: Users },
    { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
  ];

  return (
    <>
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* Authority Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-none-none flex items-center justify-center text-slate-500 hover:text-slate-900  z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Header */}
        <div className={`p-5 border-b border-slate-200 flex items-center bg-white ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none-none bg-slate-950 flex items-center justify-center text-white  shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[13px] font-black tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                  PLATFORM <span className="text-[9px] px-1.5 py-0.5 rounded-none text-slate-950 font-bold border border-slate-300 bg-slate-100 uppercase">ADMIN</span>
                </h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Platform Operations</p>
              </div>
            </Link>
          ) : (
            <Link to="/admin/dashboard" className="w-10 h-10 rounded-none-none bg-slate-950 flex items-center justify-center text-white  shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className={`flex-1 py-5 space-y-1.5 ${isCollapsed ? 'px-3 mt-4' : 'px-4'}`}>
          <p className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : ''}`}>
            {isCollapsed ? 'SYS' : 'Administration'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 py-2.5 rounded-none-none text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${isActive
                    ? 'bg-slate-100 text-slate-950 border border-slate-300 '
                    : 'text-slate-600 border border-transparent hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className={`border-t border-slate-200 bg-white space-y-3 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1 text-xs">
              <div className="w-10 h-10 rounded-none-none bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-[14px]">
                HQ
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate uppercase text-[11px] tracking-wide">
                  {user?.name || user?.username || 'System Administrator'}
                </p>
                <p className="text-[9px] text-slate-500 font-bold truncate tracking-wider mt-0.5">
                  {user?.email || 'Platform Operations'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-none-none bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-[14px]" title="Root Admin">
                HQ
              </div>
            </div>
          )}
          
          <button
            onClick={requestLogout}
            className={`group w-full flex items-center gap-2 py-2.5 rounded-none-none text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-300 ${isCollapsed ? 'justify-center px-0' : 'justify-center'}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 transition-colors text-slate-500 group-hover:text-slate-900" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 md:pl-64 ${isCollapsed ? 'md:pl-20' : ''}`}>
        <header className={`fixed top-0 right-0 z-20 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between  transition-all duration-300 w-full ${isCollapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-16rem)]'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-slate-950 text-white text-[10px] font-bold px-2 py-1.5 md:px-3 md:py-1.5 uppercase tracking-widest rounded-none  flex items-center gap-2">
              <span className="hidden sm:inline">SYSTEM ADMINISTRATION</span>
              <span className="sm:hidden">ADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={requestLogout}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-none-none border border-slate-200 bg-white px-2.5 text-slate-600  transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 md:h-9 md:px-3"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden text-[10px] font-bold uppercase tracking-wider md:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="system-admin-content flex-1 p-4 md:p-6 lg:p-8 pb-24 mt-16 max-w-[1440px] w-full mx-auto">
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
                className={`flex flex-col items-center justify-center gap-1 w-20 h-full ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold text-center leading-tight px-1 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
    </>
  );
}
