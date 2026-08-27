import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, MapPin, Clock, ShieldCheck,
  PhoneCall, MessageSquare, Crosshair, CheckCircle2, Paperclip,
  Send, MoreHorizontal, Radio, ShieldAlert, User, Loader2, Play
} from 'lucide-react';
import { authorityService } from '../api/authorityService';
import { createRealtimeSocket } from '../../../services/realtimeClient';
import { AuthorityOperationsMap } from '../components/AuthorityOperationsMap';

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
    void fetchIncidentData();

    const socket = createRealtimeSocket();
    const refreshIncident = () => { void fetchIncidentData({ background: true }); };
    socket.on('incident:updated', refreshIncident);
    socket.on('dispatch:updated', refreshIncident);
    socket.on('emergency-unit:updated', refreshIncident);
    socket.connect();

    const messageInterval = window.setInterval(fetchMessages, 5000);
    const incidentInterval = window.setInterval(refreshIncident, 10_000);

    return () => {
      window.clearInterval(messageInterval);
      window.clearInterval(incidentInterval);
      socket.off('incident:updated', refreshIncident);
      socket.off('dispatch:updated', refreshIncident);
      socket.off('emergency-unit:updated', refreshIncident);
      socket.disconnect();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIncidentData = async ({ background = false } = {}) => {
    try {
      if (!background) setLoading(true);
      setError('');
      const response = await authorityService.getIncidentDetails(id);
      const data = response?.data || response;
      setIncident(data);
      if (!background) await fetchMessages();
    } catch (err) {
      if (!background) setError(err.response?.data?.error?.message || 'Failed to load incident details');
    } finally {
      if (!background) setLoading(false);
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

  const status = (incident.status || 'OPEN').toUpperCase();
  const displayStatus = (incident.displayStatus || (incident.expired ? 'EXPIRED' : status)).toUpperCase();
  const priority = (incident.priority || incident.severity || 'HIGH').toUpperCase();
  const activeDispatches = Array.isArray(incident.activeDispatches) ? incident.activeDispatches : [];
  const tacticalUnits = activeDispatches
    .map((dispatch) => {
      const unit = dispatch.unit;
      if (!unit) return null;
      return {
        ...unit,
        baseLatitude: unit.serviceAccount?.latitude ?? null,
        baseLongitude: unit.serviceAccount?.longitude ?? null,
      };
    })
    .filter(Boolean);
  const tacticalBasePoints = activeDispatches
    .map((dispatch) => {
      const account = dispatch.unit?.serviceAccount;
      if (account?.latitude == null || account?.longitude == null) return null;
      return {
        id: `base-${dispatch.unit.id}`,
        name: account.organization || account.name || `${dispatch.requestedUnitType} Base`,
        label: 'Fleet Base',
        latitude: account.latitude,
        longitude: account.longitude,
        color: '#2563eb',
      };
    })
    .filter(Boolean);
  const tacticalIncident = {
    ...incident,
    latitude: incident.trackingLocation?.latitude ?? incident.latitude ?? incident.location?.latitude,
    longitude: incident.trackingLocation?.longitude ?? incident.longitude ?? incident.location?.longitude,
    description:
      incident.trackingLocation?.source === 'LIVE_TOURIST'
        ? `${incident.description || 'Emergency incident'} · Route target uses the tourist's latest trusted location.`
        : incident.description,
  };

  const getStatusStyles = (s) => {
    switch (s) {
      case 'OPEN': return 'bg-amber-100 text-slate-950 border-amber-200';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-slate-950 border-blue-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RESOLVED': return 'bg-emerald-100 text-slate-950 border-emerald-200';
      case 'EXPIRED': return 'bg-slate-200 text-slate-600 border-slate-300';
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
            <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900  transition-all active:scale-95 cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${getStatusStyles(displayStatus)}`}>
                {displayStatus}
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
          {!incident.expired && status === 'OPEN' && (
            <button
              onClick={() => handleAction('ACKNOWLEDGE')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50  cursor-pointer"
            >
              Acknowledge Receipt
            </button>
          )}
          {!incident.expired && status === 'ACKNOWLEDGED' && (
            <button
              onClick={() => handleAction('START')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50  cursor-pointer"
            >
              <Play className="w-4 h-4" /> Start Response
            </button>
          )}
          {!incident.expired && status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleAction('RESOLVE')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50  cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Resolved
            </button>
          )}
          <button className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900  transition-colors cursor-pointer shrink-0">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {incident.expired && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-600">
          This incident belongs to a {incident.trip?.status?.toLowerCase() || 'non-active'} trip and is expired. New fleet dispatches are disabled.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Situation Brief */}
          <div className="bg-white rounded-lg border border-slate-200  p-6 space-y-4">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-slate-400" /> Incident Command Record
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Incident Type</p>
                <p className="text-[14px] font-black text-slate-900">{incident.type || incident.title || 'Emergency'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Reported Time</p>
                <p className="text-[14px] font-black text-slate-900">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Just now'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-slate-800">Coordinates Provided</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Lat: {incident.location?.latitude || 'N/A'}, Lng: {incident.location?.longitude || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Initial Description</p>
              <p className="text-[13px] text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {incident.description || 'No detailed description provided.'}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-900">
                    <Crosshair className="h-3.5 w-3.5 text-red-600" /> Live Response Picture
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    Incident position, assigned response units and current operational movement.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                    incident.fleetAssigned ? 'bg-emerald-50 text-slate-950' : 'bg-amber-50 text-slate-950'
                  }`}>
                    {incident.fleetAssigned ? `${tacticalUnits.length} fleet${tacticalUnits.length === 1 ? '' : 's'} assigned` : 'Awaiting fleet assignment'}
                  </span>
                </div>
              </div>
              <div className="h-[320px]">
                <AuthorityOperationsMap incidents={[tacticalIncident]} units={tacticalUnits} referencePoints={tacticalBasePoints} showRoutes />
              </div>
              {activeDispatches.length > 0 && (
                <div className="grid gap-2 border-t border-slate-100 bg-white p-3 sm:grid-cols-2">
                  {activeDispatches.map((dispatch) => (
                    <Link
                      key={dispatch.id}
                      to={`/authority/response/${dispatch.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-400 hover:bg-slate-50"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                        {dispatch.unit?.name || dispatch.requestedUnitType}
                      </p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-blue-600">
                        {dispatch.status} · Open response tracking →
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Incident Chat / Timeline */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-lg border border-slate-200  overflow-hidden h-[600px] lg:h-auto lg:min-h-[600px]">

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
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 mx-1">
                      {isAuthority ? 'Command Center' : 'Tourist'} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-lg  text-[13px] font-medium leading-relaxed ${
                      isAuthority
                        ? 'bg-slate-800 text-white rounded-tr-sm'
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
                className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0  cursor-pointer"
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
