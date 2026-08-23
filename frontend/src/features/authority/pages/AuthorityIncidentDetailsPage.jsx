import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Crosshair,
  CheckCircle2,
  Paperclip,
  Send,
  MoreHorizontal
} from 'lucide-react';

const MOCK_INCIDENT = {
  id: 'INC-PRY-9421',
  category: 'Crowd Overcrowding / Stampede Risk',
  severity: 'High',
  status: 'ACTIVE',
  location: 'Sangam Ghat Sector 4, Prayagraj',
  coordinates: '25.4358° N, 81.8463° E',
  time: '4 mins ago',
  description: 'Massive crowd surge near Boat Ghat #4. Barricades are under pressure and people are starting to panic. Need immediate crowd control.',
  reportedBy: {
    id: '#DTD-PRY-8924',
    name: 'Aayansh Niranjan',
    phone: '+91 98765 43210',
    battery: '84%',
    signal: 'Good'
  },
  assignedTo: 'Patrol PCR Van #14',
  timeline: [
    { id: 1, type: 'SYSTEM', time: '10:20 AM', message: 'Incident reported via KAVACH Tourist App.' },
    { id: 2, type: 'SYSTEM', time: '10:21 AM', message: 'Auto-assigned High Severity based on keyword analysis (surge, panic, barricade).' },
    { id: 3, type: 'OPERATOR', time: '10:22 AM', sender: 'HQ Operator 4', message: 'Acknowledged. Dispatching Sector 4 Quick Response Team.' },
    { id: 4, type: 'SYSTEM', time: '10:22 AM', message: 'Assigned to Patrol PCR Van #14.' },
    { id: 5, type: 'TOURIST', time: '10:24 AM', sender: 'Aayansh Niranjan', message: 'The pressure is increasing. We are moving towards the elevated platform.' }
  ]
};

export function AuthorityIncidentDetailsPage() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const incident = MOCK_INCIDENT; // In reality, fetch by `id`

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white animate-pulse border border-red-700';
      case 'High': return 'bg-red-50 text-red-700 border border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'UNASSIGNED': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className={`font-sans max-w-[1200px] mx-auto pb-8 transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/authority/incidents">
            <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-all active:scale-95 cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${getStatusStyles(incident.status)}`}>
                {incident.status}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${getSeverityStyles(incident.severity)}`}>
                {incident.severity}
              </span>
            </div>
            <h1 className="text-[20px] font-black text-slate-900 uppercase tracking-tight">
              Incident {incident.id}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {incident.status !== 'RESOLVED' && (
            <button className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4" /> Mark Resolved
            </button>
          )}
          <button className="w-10 h-10 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Details & Reporter */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Situation Brief */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> Situation Brief
            </h2>
            
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
              <p className="text-[13px] font-black text-slate-900">{incident.category}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{incident.location}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{incident.coordinates}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Initial Description</p>
              <p className="text-[13px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                "{incident.description}"
              </p>
            </div>
            
            <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm">
              <Crosshair className="w-4 h-4" /> Locate on Tactical Map
            </button>
          </div>

          {/* Reporter & Contact */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" /> Reporter Details
            </h2>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-[14px]">
                {incident.reportedBy.name.charAt(0)}
              </div>
              <div>
                <p className="text-[13px] font-black text-slate-900">{incident.reportedBy.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{incident.reportedBy.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
                <p className="text-[11px] font-bold text-slate-700">{incident.reportedBy.phone}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Device Health</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {incident.reportedBy.battery}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">({incident.reportedBy.signal})</span>
                </div>
              </div>
            </div>

            <button className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-sm">
              View Safety Profile
            </button>
          </div>

          {/* Dispatch Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Operational Dispatch
            </h2>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Assigned Unit</p>
                <p className="text-[13px] font-black text-emerald-900">{incident.assignedTo}</p>
                <p className="text-[11px] font-medium text-emerald-700 mt-1">ETA: 2 mins (1.2 km away)</p>
              </div>
            </div>

            <button className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-sm">
              Change Assignment
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Incident Chat / Timeline */}
        <div className="lg:col-span-2 flex flex-col h-[600px] lg:h-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Communication Log
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {incident.timeline.map((event) => (
              <div key={event.id} className={`flex flex-col ${event.type === 'OPERATOR' ? 'items-end' : 'items-start'}`}>
                
                {event.type === 'SYSTEM' && (
                  <div className="w-full flex items-center justify-center my-2">
                    <div className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500">{event.time}</span>
                      <span className="text-[10px] font-medium text-slate-600">{event.message}</span>
                    </div>
                  </div>
                )}

                {event.type !== 'SYSTEM' && (
                  <div className={`max-w-[80%] flex flex-col ${event.type === 'OPERATOR' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                      {event.sender} • {event.time}
                    </span>
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[13px] font-medium leading-relaxed ${
                      event.type === 'OPERATOR' 
                        ? 'bg-slate-900 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    }`}>
                      {event.message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 shrink-0 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
                <Paperclip className="w-4 h-4" />
              </button>
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type message to tourist or field units..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatMessage.trim()) {
                    setChatMessage('');
                    // Mock send
                  }
                }}
              />
              <button 
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  chatMessage.trim() ? 'bg-[#e11d48] text-white cursor-pointer hover:bg-[#be123c]' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                onClick={() => setChatMessage('')}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
              Visible to Tourist App and Dispatch
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
