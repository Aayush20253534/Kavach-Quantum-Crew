import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import { 
  ChevronLeft, AlertTriangle, Clock, MapPin, 
  Send, ShieldAlert, CheckCircle2, User, Loader2, Play
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityIncidentDetailsPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIncidentData();
    // In a real app, you'd set up a polling or WebSocket here for messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchIncidentData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authorityService.getIncidentDetails(id);
      const data = response?.data || response;
      setIncident(data);
      await fetchMessages();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await authorityService.getIncidentMessages(id);
      const data = response?.data || response || [];
      // Assuming paginated array is under items or data is array
      setMessages(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleAction = async (actionType) => {
    try {
      setActionLoading(true);
      if (actionType === 'ACKNOWLEDGE') {
        await authorityService.acknowledgeIncident(id);
      } else if (actionType === 'START') {
        await authorityService.startIncident(id);
      } else if (actionType === 'RESOLVE') {
        await authorityService.resolveIncident(id, { resolutionNotes: 'Resolved via Command Center' });
      }
      await fetchIncidentData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await authorityService.sendIncidentMessage(id, { content: newMessage });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to send message');
    }
  };

  if (loading && !incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Retrieving tactical data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link to="/authority/incidents" className="text-red-600 font-bold text-sm hover:underline">
          &larr; Return to Queue
        </Link>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      {/* Header & Breadcrumb */}
      <div className="mb-6">
        <Link to="/authority/incidents" className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors mb-4">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Queue
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              {incident.referenceId || incident.id}
              {incident.priority === 'CRITICAL' && (
                <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] tracking-widest animate-pulse">
                  CRITICAL SOS
                </span>
              )}
            </h1>
            <p className="text-[13px] text-slate-500 font-medium mt-1">
              Reported on {new Date(incident.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {incident.status === 'PENDING' && (
              <button 
                onClick={() => handleAction('ACKNOWLEDGE')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Acknowledge Receipt
              </button>
            )}
            {incident.status === 'ACKNOWLEDGED' && (
              <button 
                onClick={() => handleAction('START')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Start Response
              </button>
            )}
            {incident.status === 'IN_PROGRESS' && (
              <button 
                onClick={() => handleAction('RESOLVE')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Resolved
              </button>
            )}
          </div>
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
<<<<<<< HEAD
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
=======
        {/* Left Col: Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-slate-400" /> Incident Context
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incident Type</p>
                <p className="text-[14px] font-bold text-slate-800">{incident.type || 'Emergency'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {incident.location?.latitude}, {incident.location?.longitude}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                <p className="text-[13px] font-medium text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {incident.description || 'No detailed description provided by the user.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden h-[300px] relative flex flex-col items-center justify-center">
            {/* Geo-Spatial Map Placeholder */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute w-32 h-32 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center animate-ping opacity-75"></div>
            <div className="absolute w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
              Live Tactical View
            </div>
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
          </div>

        </div>

<<<<<<< HEAD
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

=======
        {/* Right Col: Comms Log */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500" /> Dispatch Comms
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.length === 0 ? (
              <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-10">No messages yet</p>
            ) : (
              messages.map((msg, idx) => {
                const isAuthority = msg.senderRole === 'DISASTER_MANAGER' || msg.senderRole === 'SYSTEM_ADMIN';
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isAuthority ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 mx-1">
                      {isAuthority ? 'Command Center' : 'Tourist'} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] font-medium ${
                      isAuthority 
                        ? 'bg-slate-900 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type response..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={incident.status === 'RESOLVED'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
              <button 
                type="submit"
                disabled={incident.status === 'RESOLVED' || !newMessage.trim()}
                className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
>>>>>>> 8e2a7bff0281305b4fc619750e7d48f8b343ea41
        </div>

      </div>
    </div>
  );
}
