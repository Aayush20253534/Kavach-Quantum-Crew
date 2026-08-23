import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useGeolocation } from '../../tracking/hooks/useGeolocation';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { safetyService } from '../../safety/api/safetyService';

const TYPES = [
  ['CROWD', 'Crowd / stampede risk'],
  ['MEDICAL', 'Medical emergency'],
  ['FIRE', 'Fire / smoke'],
  ['ROAD_BLOCK', 'Road obstruction'],
  ['UNSAFE_AREA', 'Unsafe area / harassment / theft concern'],
  ['WEATHER', 'Severe weather'],
  ['OTHER', 'Other safety concern'],
];

export function ReportIncidentPage() {
  const { location, permission } = useGeolocation(undefined, false);
  const [type, setType] = useState('CROWD');
  const [severity, setSeverity] = useState('HIGH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!location) {
      setError('Live location is required to submit a safety report.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await safetyService.reportHazard({
        type,
        severity,
        title: title.trim(),
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lng,
        ...(locationName.trim() ? { locationName: locationName.trim() } : {}),
        occurredAt: new Date().toISOString(),
      });
      setCreated(result);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Unable to submit report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex justify-between gap-4 items-start mb-6">
        <div>
          <h1 className="text-2xl font-black">Report Safety Concern</h1>
          <p className="text-sm text-slate-500 mt-1">Creates a real hazard report for authority review. Use SOS for immediate emergencies.</p>
        </div>
        <Link to="/tourist/incidents/history" className="text-xs font-black text-slate-600">History →</Link>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {!created ? (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} stored securely with the report` : permission === 'denied' ? 'Location permission denied' : 'Detecting live location...'}
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">Category</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-3 text-sm">
              {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <div>
            <span className="text-xs font-bold text-slate-500">Severity</span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => (
                <button type="button" key={value} onClick={() => setSeverity(value)} className={`p-2 rounded-lg border text-[10px] font-black ${severity === value ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-slate-200'}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          <input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" className="w-full border rounded-lg px-4 py-3 text-sm" />
          <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Readable location / landmark (optional)" className="w-full border rounded-lg px-4 py-3 text-sm" />
          <textarea required minLength={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened" rows={5} className="w-full border rounded-lg px-4 py-3 text-sm" />

          <button disabled={busy || !location} className="w-full bg-rose-600 text-white rounded-lg py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Submit Report
          </button>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          <h2 className="text-xl font-black mt-4">Report submitted</h2>
          <p className="text-sm text-slate-500 mt-1">Reference: <span className="font-mono">{created.id}</span></p>
          <div className="mt-6">
            <EvidenceUploader entityId={created.id} entityType="HAZARD" />
          </div>
          <div className="mt-6 flex gap-3">
            <Link to="/tourist/incidents/history" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black">View History</Link>
            <Link to="/tourist/dashboard" className="px-5 py-2.5 border border-slate-200 rounded-lg text-xs font-black">Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}
