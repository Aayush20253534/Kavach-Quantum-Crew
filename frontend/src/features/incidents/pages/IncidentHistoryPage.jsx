import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  FileText
} from 'lucide-react';

export function IncidentHistoryPage() {
  const incidents = [
    {
      id: 'INC-PRY-9421',
      category: 'Crowd Surge at Ghat 4',
      date: 'Today, 10:15 AM',
      location: 'Sangam Sector 4 Ghats',
      status: 'Dispatched',
      severity: 'High',
      policeNote: 'Patrol PCR #14 en route to manage barricades.',
    },
    {
      id: 'INC-PRY-8102',
      category: 'Unauthorized Boat Fare Overcharging',
      date: '14 Aug 2026, 03:20 PM',
      location: 'Qila Ghat Boat Stand',
      status: 'Resolved',
      severity: 'Medium',
      policeNote: 'Tourist assistance booth resolved issue and refunded excess fare.',
    },
    {
      id: 'INC-PRY-7619',
      category: 'Lost Child Assistance',
      date: '08 Aug 2026, 11:45 AM',
      location: 'Kumbh Sector 2 Mela Ground',
      status: 'Resolved',
      severity: 'High',
      policeNote: 'Child safely reunited with family via Khoya-Paya booth sync.',
    },
  ];

  return (
    <div className="space-y-6 max-w-[800px] mx-auto pb-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Reported Incidents & Status</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Real-time status tracking and police investigation logs.
          </p>
        </div>

        <Link to="/tourist/incidents/report">
          <button className="bg-[#e11d48] hover:bg-[#be123c] text-white px-6 py-3 text-[12px] font-bold uppercase tracking-widest rounded-md shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
            <AlertTriangle className="w-4 h-4" /> Report New
          </button>
        </Link>
      </div>

      <div className="space-y-5">
        {incidents.map((inc) => {
           const isResolved = inc.status === 'Resolved';
           const isDispatched = inc.status === 'Dispatched';
           
           return (
              <div key={inc.id} className="bg-white rounded-lg p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 transition-all duration-300">
                 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                       <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">ID: {inc.id}</span>
                       <span className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm ${
                          isResolved ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]' : 
                          isDispatched ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'
                       }`}>
                          {isDispatched && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                          {inc.status}
                       </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Clock className="w-3.5 h-3.5" /> {inc.date}
                    </span>
                 </div>
                 
                 <div className="space-y-1.5 mb-5">
                    <h3 className="text-[16px] font-black text-slate-900 tracking-wide">{inc.category}</h3>
                    <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1.5">
                       <MapPin className="w-3.5 h-3.5 text-red-500" /> {inc.location}
                    </p>
                 </div>
                 
                 <div className="p-4 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Authority Response Note</span>
                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{inc.policeNote}</p>
                 </div>
              </div>
           );
        })}
      </div>
    </div>
  );
}
