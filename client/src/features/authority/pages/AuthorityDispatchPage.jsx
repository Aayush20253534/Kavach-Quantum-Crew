import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ambulance,
  Car,
  Crosshair,
  Flame,
  Loader2,
  MapPin,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

const SECTIONS = [
  { type: 'POLICE', label: 'Police', icon: ShieldAlert },
  { type: 'AMBULANCE', label: 'Hospital / Ambulance', icon: Ambulance },
  { type: 'FIRE', label: 'Fire', icon: Flame },
];

export function AuthorityDispatchPage() {
  const [searchParams] = useSearchParams();
  const incidentFromQuery = searchParams.get('incident') || '';
  const [units, setUnits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [unitRows, dispatchRows, incidentRows] = await Promise.all([
        authorityService.getUnits(),
        authorityService.getActiveDispatches(),
        authorityService.getAllIncidents(),
      ]);
      const fleet = Array.isArray(unitRows) ? unitRows : [];
      const active = Array.isArray(dispatchRows) ? dispatchRows : [];
      const allIncidents = Array.isArray(incidentRows) ? incidentRows : incidentRows?.items || incidentRows?.data || [];
      const assignable = allIncidents.filter(
        (incident) =>
          !incident.expired &&
          incident.trip?.status === 'ACTIVE' &&
          !['RESOLVED', 'DISMISSED'].includes(incident.status),
      );
      setUnits(fleet);
      setActiveDispatches(active);
      setIncidents(assignable);
      setSelectedIncidentId((current) => {
        if (incidentFromQuery && assignable.some((incident) => incident.id === incidentFromQuery)) return incidentFromQuery;
        return current || assignable[0]?.id || '';
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load fleet dispatch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [incidentFromQuery]);

  const grouped = useMemo(() => Object.fromEntries(SECTIONS.map(({ type }) => [type, units.filter((unit) => unit.type === type)])), [units]);

  const assign = async (unit) => {
    if (!selectedIncidentId) {
      setError('Select an incident before assigning a fleet.');
      return;
    }
    setAssigning(unit.id);
    setError('');
    setNotice('');
    try {
      await authorityService.dispatchUnitToIncident(selectedIncidentId, { unitType: unit.type, unitId: unit.id });
      setNotice(`${unit.name} assigned. The fleet email notification was triggered and live dispatch tracking is now active.`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to assign this fleet.');
    } finally {
      setAssigning('');
    }
  };

  const statusClass = (status) => {
    if (status === 'AVAILABLE') return 'bg-emerald-50 text-slate-950 border-emerald-200';
    if (status === 'DISPATCHED') return 'bg-blue-50 text-slate-950 border-blue-200';
    if (status === 'OUT_OF_SERVICE') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10 space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><Car className="w-6 h-6" /> Emergency Fleet Dispatch</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">Choose an incident, then assign a fixed-base Police, Hospital/Ambulance, or Fire fleet.</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50  disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync Fleet
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 ">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Incident to assign</label>
        <select value={selectedIncidentId} onChange={(e) => setSelectedIncidentId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">
          <option value="">Select an active incident</option>
          {incidents.map((incident) => <option key={incident.id} value={incident.id}>{incident.title || incident.type || 'Emergency'} · {incident.severity || incident.priority || 'Unknown'} · {incident.id.slice(0, 8)}</option>)}
        </select>
        <p className="mt-2 text-[11px] text-slate-500">Assigning a fleet creates the dispatch, marks that unit deployed, emails its login-aware dispatch link, and exposes the dispatch in live tracking.</p>
      </section>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-semibold text-red-700 flex gap-2"><ServerCrash className="w-5 h-5 shrink-0" />{error}</div>}
      {notice && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm font-semibold text-slate-950">{notice}</div>}

      {activeDispatches.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Active response tracking</h2><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{activeDispatches.length} active</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            {activeDispatches.map((dispatch) => (
              <Link key={dispatch.id} to={`/authority/response/${dispatch.id}`} className="rounded-lg border border-slate-200 bg-white p-4  hover:border-slate-400 hover:">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{dispatch.unit?.name || dispatch.requestedUnitType} · {dispatch.status}</p><p className="mt-1 text-[11px] text-slate-500">{dispatch.incident?.title || 'Emergency incident'}</p></div><Crosshair className="h-4 w-4 text-slate-500" /></div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-600">Open live tracking →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading && units.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" /><p className="text-sm font-semibold text-slate-500">Loading fleet accounts...</p></div>
      ) : (
        SECTIONS.map(({ type, label, icon: Icon }) => (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-slate-700" /><h2 className="text-sm font-black uppercase tracking-wider text-slate-900">{label}</h2><span className="text-[10px] font-bold text-slate-400">{grouped[type]?.length || 0} fleets</span></div>
            {grouped[type]?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[type].map((unit) => (
                  <article key={unit.id} className="bg-white rounded-lg border border-slate-200 p-5 ">
                    <div className="flex justify-between items-start gap-3">
                      <div><h3 className="text-[14px] font-black text-slate-900">{unit.name}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{unit.organization || unit.serviceAccount?.name || label}</p></div>
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${statusClass(unit.status)}`}>{unit.status}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
                      <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{unit.serviceAccount?.address || (unit.latitude != null ? `${Number(unit.latitude).toFixed(5)}, ${Number(unit.longitude).toFixed(5)}` : 'Base location missing')}</span></p>
                      <p><strong>Jurisdiction:</strong> {unit.jurisdiction || 'Not specified'}</p>
                      {unit.serviceAccount?.email && <p><strong>Email:</strong> {unit.serviceAccount.email}</p>}
                    </div>
                    <button onClick={() => assign(unit)} disabled={unit.status !== 'AVAILABLE' || assigning === unit.id || !selectedIncidentId} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed">
                      {assigning === unit.id ? 'Assigning…' : unit.status === 'AVAILABLE' ? 'Assign to selected incident' : 'Currently unavailable'}
                    </button>
                  </article>
                ))}
              </div>
            ) : <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No {label.toLowerCase()} fleet accounts created yet.</div>}
          </section>
        ))
      )}
    </div>
  );
}
