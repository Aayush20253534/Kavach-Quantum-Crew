import React from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Building2, 
  ShieldAlert, 
  Users, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  Activity, 
  LogOut, 
  Bell, 
  SlidersHorizontal, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
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
    <div className="min-h-screen flex bg-[#060B16] text-slate-100 antialiased">
      {/* Authority Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#070e1b] border-r border-slate-800 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/authority/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                PRAYAGRAJ <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">HQ</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Police & Tourism Command</p>
            </div>
          </Link>
        </div>

        {/* Live System Status Ticker */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-[#0b1424] border border-red-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              Dispatch Grid:
            </span>
            <Badge variant="critical" className="text-[10px] py-0">LIVE • ACTIVE</Badge>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Active Tourists:</span>
              <span className="font-mono font-bold text-sky-400">12,480</span>
            </div>
            <div className="flex justify-between">
              <span>Patrol Units Deployed:</span>
              <span className="font-mono font-bold text-emerald-400">64</span>
            </div>
            <div className="flex justify-between">
              <span>Open SOS Tickets:</span>
              <span className="font-mono font-bold text-amber-400">2</span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Authority Controls</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-2 py-1 text-xs">
            <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center font-bold text-red-400">
              HQ
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-200 truncate">Officer In-Charge</p>
              <p className="text-[10px] text-slate-400 truncate">Sangam Command Post</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-slate-400 hover:text-red-400 justify-start"
            leftIcon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#070e1b] border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="danger" className="text-xs">
              PRAYAGRAJ SECTOR 1-8 LIVE RADAR
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tourist/dashboard">
              <Button variant="secondary" size="sm" rightIcon={ExternalLink}>
                Switch to Tourist App
              </Button>
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
