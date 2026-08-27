import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
import { emergencyServicesApi } from '../../features/emergency-services/api/emergencyServicesApi';

export function ResponderLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [responderProfile, setResponderProfile] = useState(null);
  const [trackingDispatches, setTrackingDispatches] = useState([]);
  const [trackingDispatchId, setTrackingDispatchId] = useState('');
  const [trackingSnapshot, setTrackingSnapshot] = useState(null);
  const [trackingLocation, setTrackingLocation] = useState(null);
  const [trackingSending, setTrackingSending] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    emergencyServicesApi.getMe()
      .then((response) => {
        if (!cancelled) setResponderProfile(response?.data?.data || response?.data || null);
      })
      .catch(() => {
        if (!cancelled) setResponderProfile(null);
      });
    return () => { cancelled = true; };
  }, []);

  const loadTrackingDispatches = useCallback(async () => {
    try {
      const response = await emergencyServicesApi.getDispatches();
      const rows = response?.data?.data || [];
      const active = rows.filter(
        (currentDispatch) =>
          !['COMPLETED', 'CANCELLED'].includes(
            String(currentDispatch.status || '').toUpperCase(),
          ),
      );

      setTrackingDispatches(active);
      setTrackingDispatchId((current) =>
        active.some((currentDispatch) => currentDispatch.id === current)
          ? current
          : active[0]?.id || '',
      );
      setTrackingError('');
    } catch (error) {
      setTrackingError(
        error?.response?.data?.error?.message ||
          'Unable to synchronize active fleet dispatches.',
      );
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  const loadTrackingSnapshot = useCallback(async () => {
    if (!trackingDispatchId) {
      setTrackingSnapshot(null);
      return;
    }

    try {
      const response = await emergencyServicesApi.getTracking(trackingDispatchId);
      setTrackingSnapshot(response?.data?.data || null);
      setTrackingError('');
    } catch (error) {
      setTrackingError(
        error?.response?.data?.error?.message ||
          'Unable to synchronize live fleet tracking.',
      );
    }
  }, [trackingDispatchId]);

  useEffect(() => {
    loadTrackingDispatches();
    const timer = window.setInterval(loadTrackingDispatches, 15000);
    return () => window.clearInterval(timer);
  }, [loadTrackingDispatches]);

  useEffect(() => {
    if (!trackingDispatchId) {
      setTrackingSnapshot(null);
      return undefined;
    }

    loadTrackingSnapshot();
    const timer = window.setInterval(loadTrackingSnapshot, 10000);

    return () => window.clearInterval(timer);
  }, [loadTrackingSnapshot, trackingDispatchId]);

  useEffect(() => {
    if (!trackingDispatchId || !navigator.geolocation) return undefined;

    let cancelled = false;

    const watchId = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        if (cancelled) return;

        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        setTrackingLocation(nextLocation);
        setTrackingSending(true);

        try {
          await emergencyServicesApi.updateDispatchLocation(
            trackingDispatchId,
            nextLocation,
          );

          if (!cancelled) setTrackingError('');
        } catch (error) {
          if (!cancelled) {
            setTrackingError(
              error?.response?.data?.error?.message ||
                'Unable to transmit live fleet GPS.',
            );
          }
        } finally {
          if (!cancelled) setTrackingSending(false);
        }
      },
      () => {
        if (!cancelled) {
          setTrackingError(
            'Location permission is required for continuous fleet tracking.',
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingDispatchId]);

  const refreshBackgroundTracking = useCallback(async () => {
    await loadTrackingDispatches();
    await loadTrackingSnapshot();
  }, [loadTrackingDispatches, loadTrackingSnapshot]);

  const backgroundTracking = useMemo(
    () => ({
      dispatches: trackingDispatches,
      selectedId: trackingDispatchId,
      setSelectedId: setTrackingDispatchId,
      tracking: trackingSnapshot,
      location: trackingLocation,
      sending: trackingSending,
      error: trackingError,
      loading: trackingLoading,
      refresh: refreshBackgroundTracking,
    }),
    [
      refreshBackgroundTracking,
      trackingDispatches,
      trackingDispatchId,
      trackingSnapshot,
      trackingLocation,
      trackingSending,
      trackingError,
      trackingLoading,
    ],
  );

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

  const handleResponderNavigation = (path) => {
    if (location.pathname === path) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    navigate(path);
  };

  const getTheme = () => {
    switch (user?.role) {
      case 'POLICE':
        return {
          color: 'blue',
          textClass: 'text-blue-700',
          bgClass: 'bg-blue-600',
          hoverBgClass: 'hover:bg-blue-700',
          lightBgClass: 'bg-blue-50',
          borderClass: 'border-blue-200',
          strongBorderClass: 'border-blue-500',
          ringClass: 'ring-blue-100',
          markerColor: '#2563eb',
          icon: ShieldAlert,
          label: 'Police Response',
          unitLabel: 'Police Unit',
          readinessLabel: 'Patrol readiness',
        };
      case 'FIRE':
        return {
          color: 'red',
          textClass: 'text-red-700',
          bgClass: 'bg-red-600',
          hoverBgClass: 'hover:bg-red-700',
          lightBgClass: 'bg-red-50',
          borderClass: 'border-red-200',
          strongBorderClass: 'border-red-500',
          ringClass: 'ring-red-100',
          markerColor: '#dc2626',
          icon: Flame,
          label: 'Fire Response',
          unitLabel: 'Fire Unit',
          readinessLabel: 'Station readiness',
        };
      case 'AMBULANCE':
        return {
          color: 'emerald',
          textClass: 'text-emerald-700',
          bgClass: 'bg-emerald-600',
          hoverBgClass: 'hover:bg-emerald-700',
          lightBgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-200',
          strongBorderClass: 'border-emerald-500',
          ringClass: 'ring-emerald-100',
          markerColor: '#16a34a',
          icon: Ambulance,
          label: 'Medical Response',
          unitLabel: 'Ambulance / Hospital Unit',
          readinessLabel: 'Medical readiness',
        };
      default:
        return {
          color: 'slate',
          textClass: 'text-slate-700',
          bgClass: 'bg-slate-700',
          hoverBgClass: 'hover:bg-slate-800',
          lightBgClass: 'bg-slate-100',
          borderClass: 'border-slate-200',
          strongBorderClass: 'border-slate-500',
          ringClass: 'ring-slate-100',
          markerColor: '#475569',
          icon: Radio,
          label: 'Emergency Response',
          unitLabel: 'Responder Unit',
          readinessLabel: 'Unit readiness',
        };
    }
  };

  const theme = getTheme();
  const ThemeIcon = theme.icon;

  const navItems = [
    { name: 'Active Dispatch', path: '/responder/dispatch', icon: Radio },
    { name: 'Live Tracking', path: '/responder/tracking', icon: MapPin },
    { name: 'Dispatch History', path: '/responder/history', icon: History },
  ];

  const userName = user?.organization || user?.name || 'Responder Unit';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased relative">
      <SignOutConfirmModal
        open={logoutOpen}
        busy={logoutBusy}
        onCancel={() => !logoutBusy && setLogoutOpen(false)}
        onConfirm={handleLogout}
      />

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-300 fixed top-0 left-0 h-screen isolate z-[10000] pointer-events-auto transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm z-40 cursor-pointer transition-transform hover:scale-110"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className={`p-6 pb-2 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-lg ${theme.lightBgClass} ${theme.textClass}`}>
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
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-lg ${theme.lightBgClass} ${theme.textClass}`}>
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
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleResponderNavigation(item.path)}
                  className={`relative z-[10010] flex w-full touch-manipulation items-center gap-3 py-3 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
                    isActive
                      ? `${theme.lightBgClass} ${theme.textClass} after:absolute after:left-0 after:top-2 after:bottom-2 after:w-1 after:${theme.bgClass} after:rounded-r-sm`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`pt-4 border-t border-slate-200 bg-white space-y-4 ${isCollapsed ? 'p-3' : 'p-6'}`}>
          {!isCollapsed && responderProfile && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Response Base</p>
              <p className="mt-1 truncate text-[11px] font-bold text-slate-800">
                {responderProfile.organization || responderProfile.name || userName}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                {responderProfile.address || responderProfile.jurisdiction || 'Operational location configured'}
              </p>
            </div>
          )}
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
      <div className={`relative z-0 flex min-h-screen min-w-0 flex-1 flex-col transition-[margin,width] duration-300 ease-out ${isCollapsed ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-[280px] lg:w-[calc(100%-280px)]'}`} >

        <header className={`fixed top-0 right-0 z-[60] h-16 bg-white border-b border-slate-300 px-4 lg:px-8 flex items-center justify-between transition-[width] duration-300 w-full ${isCollapsed ? 'lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-280px)]'}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${theme.lightBgClass} flex items-center justify-center shrink-0`}>
              <ThemeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textClass}`} />
            </div>
            <div>
              <p className="text-[12px] sm:text-[14px] font-bold text-slate-900 tracking-tight uppercase">
                {theme.label}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-[13px] font-black text-slate-900">{timeLabel}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dateLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 border border-slate-200">
                {initial}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">{userName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 mt-16 pb-24 lg:pb-8 max-w-[1500px] w-full mx-auto">
          <Outlet context={{ theme, responderProfile, backgroundTracking }} />
        </main>
      </div>
    </div>
  );
}
