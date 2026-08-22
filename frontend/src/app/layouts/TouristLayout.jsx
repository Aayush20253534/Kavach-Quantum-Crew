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
  Menu, 
  X,
  Radio,
  QrCode,
  FileText,
  Activity
} from 'lucide-react';
import { SOSButton } from '../../components/ui/SOSButton';
import { Badge } from '../../components/ui/Badge';
import { logout } from '../../features/auth/store/authSlice';

export function TouristLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/tourist/dashboard', icon: LayoutDashboard },
    { name: 'My Trips', path: '/tourist/trips/current', icon: Compass },
    { name: 'Groups & QR', path: '/tourist/groups/create', icon: Users },
    { name: 'Report Incident', path: '/tourist/incidents/report', icon: AlertTriangle },
    { name: 'Safety ID Profile', path: '/tourist/profile', icon: User },
  ];

  const bottomNavItems = [
    { name: 'Home', path: '/tourist/dashboard', icon: LayoutDashboard },
    { name: 'Trips', path: '/tourist/trips/current', icon: Compass },
    { name: 'SOS', isSOS: true },
    { name: 'Groups', path: '/tourist/groups/create', icon: Users },
    { name: 'Profile', path: '/tourist/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased pb-20 md:pb-0 font-sans selection:bg-slate-900 selection:text-white">
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen z-30 rounded-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white rounded-none">
          <Link to="/tourist/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-slate-900 flex items-center justify-center text-white shadow-none">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                KAVACH <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-slate-100 text-slate-600 font-bold border border-slate-200 uppercase">Tourist</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Safety Network</p>
            </div>
          </Link>
        </div>

        {/* User Card Mini Preview */}
        <div className="p-4 mx-4 mt-4 rounded-none bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-900 shadow-none border border-slate-300">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate uppercase">{user?.name || 'Tourist User'}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">ID: #DID-PRY-8924</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-500">Risk Status:</span>
            <span className="text-[9px] py-0.5 px-2 bg-green-100 text-green-700 border border-green-200 rounded-none">SAFE ZONE</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-none text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                    : 'text-slate-500 border-l-4 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-600'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trip Tools</p>
            <Link
              to="/tourist/trips/create"
              className="group flex items-center gap-3 px-4 py-3 rounded-none text-[11px] font-bold uppercase tracking-wider text-slate-500 border-l-4 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-600 transition-all"
            >
              <Compass className="w-4 h-4 transition-colors text-slate-400 group-hover:text-red-600" />
              <span>Plan New Trip</span>
            </Link>
            <Link
              to="/tourist/groups/join"
              className="group flex items-center gap-3 px-4 py-3 rounded-none text-[11px] font-bold uppercase tracking-wider text-slate-500 border-l-4 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-600 transition-all"
            >
              <QrCode className="w-4 h-4 transition-colors text-slate-400 group-hover:text-red-600" />
              <span>Scan Group QR</span>
            </Link>
            <Link
              to="/tourist/incidents/history"
              className="group flex items-center gap-3 px-4 py-3 rounded-none text-[11px] font-bold uppercase tracking-wider text-slate-500 border-l-4 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-600 transition-all"
            >
              <FileText className="w-4 h-4 transition-colors text-slate-400 group-hover:text-red-600" />
              <span>Incident Reports</span>
            </Link>
          </div>
        </nav>

        {/* SOS Button Widget in Desktop Sidebar */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          <SOSButton size="md" className="w-full justify-center rounded-none" />
          <button
            onClick={handleLogout}
            className="group w-full flex items-center justify-center gap-2 py-2 rounded-none text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4 transition-colors text-slate-500 group-hover:text-red-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN APPLICATION AREA
      ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Context Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/tourist/dashboard" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-none bg-slate-900 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 uppercase">KAVACH</span>
            </Link>

            {/* Current Geo Location Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-none bg-slate-50 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-none bg-green-500 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Sangam Sector 4</span>
              <span className="text-[10px] text-slate-400 font-mono ml-2 border-l border-slate-300 pl-2">25.4358° N</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick SOS in Top Bar */}
            <div className="hidden sm:flex">
                <SOSButton size="sm" label="SOS" className="rounded-none" />
            </div>

            {/* Notifications */}
            <button className="group relative p-2 rounded-none bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300 transition cursor-pointer">
              <Bell className="w-4 h-4 transition-colors text-slate-500 group-hover:text-red-600" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-none bg-red-500"></span>
            </button>

            {/* Profile Avatar Pill */}
            <Link
              to="/tourist/profile"
              className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-none bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
            >
              <div className="w-6 h-6 rounded-none bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-900 border border-slate-300 group-hover:bg-red-100 group-hover:border-red-300 group-hover:text-red-700 transition-colors">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 hidden md:inline group-hover:text-red-700 transition-colors">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </Link>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* =========================================================
          MOBILE BOTTOM NAVIGATION (For tourists on mobile devices)
      ========================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item, idx) => {
          if (item.isSOS) {
            return (
              <div key="sos" className="-mt-6">
                <SOSButton size="floating" className="rounded-none" />
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`group flex flex-col items-center justify-center w-14 py-1 rounded-none text-[9px] uppercase tracking-wider font-bold transition-colors ${
                isActive
                  ? 'text-red-600'
                  : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-colors ${isActive ? 'text-red-600 stroke-[2.5]' : 'text-slate-400 group-hover:text-red-600'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
