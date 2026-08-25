import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, MapPin, Clock, ShieldCheck, 
  PhoneCall, MessageSquare, Crosshair, CheckCircle2, Paperclip, 
  Send, MoreHorizontal, Radio, ShieldAlert, User, Loader2, Play
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityIncidentDetailsPage() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const [incident, setIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchIncidentData();
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
      const data = response || [];
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
    if (e?.preventDefault) e.preventDefault();
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

  const status = (incident.status || 'PENDING').toUpperCase();
  const priority = (incident.priority || 'HIGH').toUpperCase();

  const getStatusStyles = (s) => {
    switch (s) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityStyles = (p) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-600 text-white animate-pulse border-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${getStatusStyles(status)}`}>
                {status}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${getSeverityStyles(priority)}`}>
                {priority}
              </span>
            </div>
            <h1 className="text-[20px] font-black text-slate-900 uppercase tracking-tight font-mono">
              {incident.referenceId || incident.id}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'PENDING' && (
            <button 
              onClick={() => handleAction('ACKNOWLEDGE')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            >
              Acknowledge Receipt
            </button>
          )}
          {status === 'ACKNOWLEDGED' && (
            <button 
              onClick={() => handleAction('START')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4" /> Start Response
            </button>
          )}
          {status === 'IN_PROGRESS' && (
            <button 
              onClick={() => handleAction('RESOLVE')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Resolved
            </button>
          )}
          <button className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors cursor-pointer shrink-0">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Situation Brief */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-slate-400" /> Incident Context
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incident Type</p>
                <p className="text-[14px] font-black text-slate-900">{incident.type || incident.title || 'Emergency'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reported Time</p>
                <p className="text-[14px] font-black text-slate-900">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Just now'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-slate-800">Coordinates Provided</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Lat: {incident.location?.latitude || 'N/A'}, Lng: {incident.location?.longitude || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Initial Description</p>
              <p className="text-[13px] text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {incident.description || 'No detailed description provided.'}
              </p>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden h-[250px] relative flex flex-col items-center justify-center mt-6">
              {/* Geo-Spatial Map Placeholder */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute w-32 h-32 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center animate-ping opacity-75"></div>
              <div className="absolute w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
              <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Crosshair className="w-3 h-3" /> Live Tactical View
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Incident Chat / Timeline */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[600px] lg:h-auto lg:min-h-[600px]">
          
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Communication Log
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </div>
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
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-[13px] font-medium leading-relaxed ${
                      isAuthority 
                        ? 'bg-slate-900 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type response..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={status === 'RESOLVED'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={status === 'RESOLVED' || !newMessage.trim()}
                className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
