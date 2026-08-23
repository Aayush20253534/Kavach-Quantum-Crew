import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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
          </div>

        </div>

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
        </div>

      </div>
    </div>
  );
}
