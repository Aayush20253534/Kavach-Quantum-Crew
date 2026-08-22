import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  BatteryMedium,
  Radio
} from 'lucide-react';

export function CreateGroupPage() {
  const [copied, setCopied] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const inviteCode = 'KAVACH-PRY-8924';
  const inviteLink = `https://kavach-safety.in/join?code=${inviteCode}`;

  const currentMembers = [
    { name: 'Prachi Maurya (You)', role: 'Group Leader', battery: '88%', status: 'Online' },
    { name: 'Aayansh Sharma', role: 'Member', battery: '74%', status: 'Online' },
    { name: 'Kavita Verma', role: 'Member', battery: '92%', status: 'Online' },
    { name: 'Rohan Gupta', role: 'Member', battery: '40%', status: 'Online' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`max-w-[1000px] mx-auto space-y-6 pb-10 font-sans transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Family & Group Safety Circle</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Sync location and battery telemetry with your companions via dynamic QR pairing.
          </p>
        </div>

        <Link to="/tourist/groups/join">
          <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-6 py-3 rounded-md font-bold text-[12px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <QrCode className="w-4 h-4" /> Scan to Join
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left 7 Cols: Group QR Code Card */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-lg">
              <h2 className="text-[14px] font-black text-slate-900 tracking-wide">Dynamic Group QR</h2>
              <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-md flex items-center gap-1.5 shadow-sm">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
                 ACTIVE & SYNCED
              </span>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <p className="text-[13px] text-slate-500 font-medium text-center mb-8 max-w-sm">
                Ask your companions to scan this code with their phone camera or Kavach app to join the tracking circle.
              </p>

              {/* QR Code Container Mockup */}
              <div className="relative mx-auto w-56 h-56 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center mb-8">
                <div className="w-full h-full border-[3px] border-slate-800 rounded-lg p-3 flex flex-col items-center justify-between bg-white">
                  <div className="w-full flex justify-between">
                    <div className="w-8 h-8 bg-slate-800 rounded-sm"></div>
                    <div className="w-8 h-8 bg-slate-800 rounded-sm"></div>
                  </div>
                  {/* Center Radar / Shield Branding */}
                  <div className="w-12 h-12 rounded-md bg-[#e11d48] flex items-center justify-center text-white shadow-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="w-full flex justify-between items-end">
                    <div className="w-8 h-8 bg-slate-800 rounded-sm"></div>
                    <span className="text-[10px] font-mono font-bold tracking-tight text-slate-500">#KAVACH-8924</span>
                  </div>
                </div>
              </div>

              {/* Invite Code Bar */}
              <div className="w-full max-w-sm flex items-stretch border border-slate-200 rounded-md overflow-hidden shadow-sm">
                <div className="flex-1 bg-slate-50 px-4 py-3 flex items-center justify-between border-r border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite Code</span>
                  <span className="font-mono font-black text-slate-900 text-[14px]">{inviteCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-4 flex items-center justify-center transition-colors cursor-pointer"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-[#16a34a]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Connected Group Members */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-lg">
              <h2 className="text-[14px] font-black text-slate-900 tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Circle ({currentMembers.length}/6)
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded">
                LIVE GPS
              </span>
            </div>
            
            <div className="p-5 space-y-3 flex-1">
              {currentMembers.map((mem, idx) => (
                <div
                  key={idx}
                  className={`p-3 border border-slate-200 rounded-md bg-white flex items-center justify-between hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  style={{ transitionDelay: `${250 + (idx * 75)}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[12px]">
                      {mem.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{mem.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{mem.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#16a34a] font-bold uppercase tracking-wider block">{mem.status}</span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-end gap-1 mt-0.5">
                      <BatteryMedium className={`w-3.5 h-3.5 ${parseInt(mem.battery) > 20 ? 'text-[#16a34a]' : 'text-[#e11d48]'}`} />
                      {mem.battery}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Group Safety Broadcast */}
            <div className="p-4 m-5 mt-0 rounded-md bg-[#fef2f2] border border-[#fecaca]">
              <span className="font-bold text-[#b91c1c] text-[12px] flex items-center gap-1.5 mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Proximity Safety Geofence
              </span>
              <p className="text-[#991b1b] font-medium text-[11px] leading-relaxed">
                All 4 companions will be notified instantly if any member strays beyond <strong className="font-bold">150 meters</strong> in high-density zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
