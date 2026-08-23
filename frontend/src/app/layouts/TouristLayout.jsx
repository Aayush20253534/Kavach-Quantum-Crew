import React, { useEffect, useState } from 'react';
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
  History,
  Menu,
  ChevronLeft,
  ShieldAlert
} from 'lucide-react';
import { logout } from '../../features/auth/store/authSlice';
import { AIChatWidget } from '../../features/chatbot/components/AIChatWidget';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
import { useGeolocation } from '../../features/tracking/hooks/useGeolocation';

export function TouristLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosState, setSosState] = useState('idle'); // 'idle' | 'triggering' | 'active'
  const [now, setNow] = useState(() => new Date());
  const { location: liveLocation, permission: locationPermission } = useGeolocation(undefined, false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' });
  const coordinateLabel = liveLocation
    ? `${liveLocation.lat.toFixed(4)}° N, ${liveLocation.lng.toFixed(4)}° E`
    : locationPermission === 'denied' ? 'Location permission denied' : 'Detecting current location...';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleTriggerSOS = () => {
    setSosState('triggering');
    // Simulate API call to POST /api/v1/sos
    setTimeout(() => {
      setSosState('active');
    }, 1500);
  };

  const closeSosModal = () => {
    setIsSosModalOpen(false);
    setTimeout(() => setSosState('idle'), 300); // reset after animation
  };

  const navItems = [
    { name: 'Dashboard', path: '/tourist/dashboard', icon: LayoutDashboard },
    { name: 'Live Tracking', path: '/tourist/tracking', icon: Navigation },
    { name: 'My Trips', path: '/tourist/trips/current', icon: Compass },
    { name: 'Join Group', path: '/tourist/groups/join', icon: Users },
    { name: 'Report Incident', path: '/tourist/incidents/report', icon: ShieldAlert },
    { name: 'Incident History', path: '/tourist/incidents/history', icon: History },
    { name: 'Safety Check-ins', path: '/tourist/checkins', icon: ShieldCheck },
    { name: 'Safety ID Profile', path: '/tourist/profile', icon: User },
  ];

  const tripTools = [
    { name: 'Plan New Trip', path: '/tourist/trips/create', icon: PlusCircle },
    { name: 'Trip History', path: '/tourist/trips/history', icon: History },
  ];

  const mobileNavItems = [
    { name: 'Home', path: '/tourist/dashboard', icon: LayoutDashboard },
    { name: 'Radar', path: '/tourist/tracking', icon: Navigation },
    { name: 'SOS', path: '#', icon: Phone, isSos: true },
    { name: 'Trips', path: '/tourist/trips/current', icon: Compass },
    { name: 'Profile', path: '/tourist/profile', icon: User },
  ];

  const userName = user?.name?.trim() || user?.username || 'Tourist';
  const initial = userName.charAt(0).toUpperCase();
  const profileImage = user?.profilePicUrl || user?.profilePic || null;
  const userIdLabel = user?.id
    ? `#${String(user.id).slice(0, 8).toUpperCase()}`
    : 'Authenticated tourist';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 antialiased font-sans relative">

      {/* GLOBAL SOS MODAL */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative flex flex-col items-center text-center">

            {sosState === 'idle' && (
              <>
                <button
                  onClick={closeSosModal}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-10 h-10 animate-pulse" />
                </div>
                <h2 className="text-[20px] font-black text-slate-900 uppercase tracking-tight mb-2">Emergency SOS</h2>
                <p className="text-[13px] text-slate-500 font-medium mb-8 leading-relaxed">
                  This will immediately alert local police, medical teams, and your emergency contacts with your live location.
                </p>
                <button
                  onClick={handleTriggerSOS}
                  className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white py-4 rounded-xl font-black text-[14px] uppercase tracking-widest shadow-[0_4px_20px_0_rgba(225,29,72,0.4)] transition-all active:scale-95 cursor-pointer"
                >
                  PRESS TO TRIGGER SOS
                </button>
                <button
                  onClick={closeSosModal}
                  className="w-full mt-3 py-3 text-slate-500 font-bold text-[12px] uppercase tracking-wider hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}

            {sosState === 'triggering' && (
              <div className="py-8">
                <div className="w-20 h-20 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-tight">Transmitting...</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-2">Connecting to Prayagraj Command Center</p>
              </div>
            )}

            {sosState === 'active' && (
              <div className="py-4">
                <div className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(225,29,72,0.6)] animate-pulse">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-tight mb-2">SOS ACTIVE</h2>
                <p className="text-[13px] text-slate-600 font-medium mb-6 leading-relaxed">
                  Police Patrol PCR #14 is en route to your location. Stay calm and remain at your current position if safe.
                </p>
                <button
                  onClick={closeSosModal}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-lg transition-colors cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand Header */}
        <div className={`p-6 pb-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link to="/tourist/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1f2c] flex items-center justify-center text-white shadow-sm shrink-0">
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
          ) : (
            <Link to="/tourist/dashboard" className="w-10 h-10 rounded-xl bg-[#1a1f2c] flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </Link>
          )}
        </div>

        {/* User Card */}
        <div className={`px-6 py-4 ${isCollapsed ? 'px-3' : ''}`}>
          <div className={`bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-2xl flex flex-col gap-4 ${isCollapsed ? 'p-2 items-center' : 'p-4'}`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div
                className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-sm font-bold text-slate-700 shrink-0 cursor-pointer"
                title={isCollapsed ? userName : undefined}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${userName} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate uppercase tracking-wide">{userName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">ID: {userIdLabel}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Status</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Safe Zone</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className={`space-y-1 mb-6 ${isCollapsed ? 'px-3' : 'px-6'}`}>
            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : 'pl-2'}`}>
              {isCollapsed ? 'MAIN' : 'Main Menu'}
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/tourist/dashboard'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 rounded-xl text-[12px] font-semibold transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'
                    } ${isActive
                      ? 'bg-red-50 text-red-600 relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-red-600 after:rounded-r-full'
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

          <div className={`space-y-1 mb-6 ${isCollapsed ? 'px-3' : 'px-6'}`}>
            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ${isCollapsed ? 'text-center pl-0 text-[8px]' : 'pl-2'}`}>
              {isCollapsed ? 'TRIP' : 'Trip Tools'}
            </p>
            {tripTools.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 rounded-xl text-[12px] font-semibold transition-all ${isCollapsed ? 'justify-center px-0' : 'px-4'
                    } ${isActive
                      ? 'bg-red-50 text-red-600 relative after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:bg-red-600 after:rounded-r-full'
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

        {/* Bottom Actions */}
        <div className={`pt-4 border-t border-slate-100 bg-white space-y-4 ${isCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={() => setIsSosModalOpen(true)}
            className={`w-full bg-[#e11d48] hover:bg-[#be123c] text-white py-3.5 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 cursor-pointer ${isCollapsed ? 'px-0' : 'px-4'}`}
            title={isCollapsed ? "SOS EMERGENCY" : undefined}
          >
            <Phone className="w-4 h-4 shrink-0" />
            {!isCollapsed && "SOS EMERGENCY"}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN APPLICATION AREA
      ========================================================= */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pl-0 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-[280px]'}`}>

        {/* Top Navbar */}
        <header className={`fixed top-0 right-0 z-20 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 w-full ${isCollapsed ? 'lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-280px)]'}`}>

          {/* Left: Location */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-1 cursor-pointer group">
                <span className="text-[11px] sm:text-[13px] font-black text-slate-900 uppercase tracking-wide group-hover:text-red-600 transition-colors truncate max-w-[140px] sm:max-w-none">
                  {liveLocation ? 'CURRENT LIVE LOCATION' : 'LOCATION PENDING'}
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono mt-0.5 hidden sm:block">{coordinateLabel}</p>
            </div>
          </div>

          {/* Middle: Time & Date */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-[13px] font-black text-slate-900">{timeLabel}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dateLabel}</p>
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationsDropdown />

            <Link to="/tourist/profile" className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 border border-slate-200 group-hover:border-slate-300 transition-colors">
                {initial}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">{userName}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 mt-16 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        {/* =========================================================
            MOBILE BOTTOM NAVIGATION BAR
        ========================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/tourist/dashboard'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            if (item.isSos) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsSosModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 relative -top-4 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-[#f8f9fa] shadow-red-500/30">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 mt-1">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 w-14 h-full ${isActive ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold ${isActive ? 'text-red-600' : 'text-slate-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>

      <AIChatWidget />
    </div>
  );
}
