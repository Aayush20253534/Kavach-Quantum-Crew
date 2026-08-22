import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Safe Zone Entered',
      message: 'You have entered the Sangam Sector 4 secure perimeter.',
      time: 'Just now',
      read: false,
      icon: ShieldCheck
    },
    {
      id: 2,
      type: 'warning',
      title: 'Group Member Strayed',
      message: 'Aayansh has moved >150m away from the group center.',
      time: '12m ago',
      read: false,
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'info',
      title: 'Trip Approved',
      message: 'Your route to Kashi Vishwanath has been logged.',
      time: '1h ago',
      read: true,
      icon: Info
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
          isOpen ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#e11d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount}
          </div>
        )}
      </button>

      <div 
        className={`absolute top-[calc(100%+12px)] right-0 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden transition-all duration-300 origin-top-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm">
          <h3 className="text-[14px] font-black text-slate-900 tracking-wide">Notifications</h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-[10px] font-bold text-[#16a34a] hover:text-[#15803d] uppercase tracking-widest transition-colors cursor-pointer"
          >
            Mark all read
          </button>
        </div>
        
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`p-5 flex gap-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer ${!notif.read ? 'bg-white' : 'bg-slate-50/40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                  notif.type === 'success' ? 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]' :
                  notif.type === 'warning' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                  'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-[13px] font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{notif.time}</span>
                  </div>
                  <p className={`text-[12px] leading-relaxed ${!notif.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0 mt-2 shadow-sm animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="p-3 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 text-center hover:bg-slate-100 transition-colors cursor-pointer">
          <button className="text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors w-full h-full">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}
