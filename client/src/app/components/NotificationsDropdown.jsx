import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, Info, ShieldCheck } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../../features/notifications/api/notificationQueries';

const relativeTime = (dateValue) => {
  if (!dateValue) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const iconForNotification = (notification) => {
  const text = `${notification.type || ''} ${notification.title || ''}`.toUpperCase();
  if (text.includes('ALERT') || text.includes('EMERGENCY') || text.includes('ESCALAT')) return AlertTriangle;
  if (text.includes('SAFE') || text.includes('RESOLV')) return ShieldCheck;
  return Info;
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className={`relative w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
          isOpen ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#e11d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      <div className={`absolute top-[calc(100%+12px)] right-0 w-[min(21rem,calc(100vw-1.5rem))] sm:w-96 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[90] overflow-hidden transition-all duration-300 origin-top-right ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      }`}>
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm">
          <h3 className="text-[14px] font-black text-slate-900 tracking-wide">Notifications</h3>
          <button
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="text-[10px] font-bold text-[#16a34a] disabled:text-slate-300 hover:text-[#15803d] uppercase tracking-widest transition-colors cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {isLoading && <p className="p-5 text-[12px] text-slate-400">Loading notifications...</p>}
          {!isLoading && notifications.length === 0 && (
            <div className="p-8 text-center">
              <Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] font-semibold text-slate-500">No notifications yet</p>
            </div>
          )}
          {notifications.map((notification) => {
            const Icon = iconForNotification(notification);
            const unread = !notification.readAt;
            return (
              <button
                type="button"
                key={notification.id}
                onClick={() => unread && markRead.mutate(notification.id)}
                className={`w-full text-left p-4 sm:p-5 flex gap-3 sm:gap-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${unread ? 'bg-white' : 'bg-slate-50/40'}`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-slate-50 text-slate-600 border-slate-200">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-[11px] sm:text-[13px] font-bold truncate ${unread ? 'text-slate-900' : 'text-slate-600'}`}>{notification.title}</p>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{relativeTime(notification.createdAt)}</span>
                  </div>
                  <p className={`text-[10px] sm:text-[12px] leading-relaxed ${unread ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>{notification.message}</p>
                </div>
                {unread && <div className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
