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
    <div className="min-h-screen flex bg-[#060B16] text-slate-100 antialiased pb-20 md:pb-0">
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#080d18] border-r border-slate-800/80 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/tourist/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                KAVACH <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-bold uppercase">Tourist</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Prayagraj Safety Network</p>
            </div>
          </Link>
        </div>

        {/* User Card Mini Preview */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-[#0d1526] border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Tourist User'}</p>
              <p className="text-[10px] text-slate-400 truncate">ID: #DID-PRY-8924</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
            <span className="text-slate-400">Risk Status:</span>
            <Badge variant="safe" className="text-[10px] py-0 px-2">SAFE ZONE</Badge>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Trip Tools</p>
            <Link
              to="/tourist/trips/create"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Plan New Trip</span>
            </Link>
            <Link
              to="/tourist/groups/join"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Scan Group QR</span>
            </Link>
            <Link
              to="/tourist/incidents/history"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>My Incident Reports</span>
            </Link>
          </div>
        </nav>

        {/* SOS Button Widget in Desktop Sidebar */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <SOSButton size="md" className="w-full justify-center" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
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
        {/* Top Navbar Context Header */}
        <header className="sticky top-0 z-20 h-16 bg-[#060B16]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tourist/dashboard" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-white">KAVACH</span>
            </Link>

            {/* Current Geo Location Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1526] border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-300 font-medium">Sangam Sector 4, Prayagraj</span>
              <span className="text-[10px] text-slate-500 font-mono">25.4358° N</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick SOS in Top Bar */}
            <SOSButton size="sm" label="SOS" className="sm:flex" />

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-[#0d1526] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400"></span>
            </button>

            {/* Profile Avatar Pill */}
            <Link
              to="/tourist/profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-[#0d1526] border border-slate-800 hover:border-sky-500/40 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden md:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
        {bottomNavItems.map((item, idx) => {
          if (item.isSOS) {
            return (
              <div key="sos" className="-mt-7">
                <SOSButton size="floating" />
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
