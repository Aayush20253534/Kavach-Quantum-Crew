import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safetyService } from '../../safety/api/safetyService';

const asArray = (value) => value?.items || value || [];

export function IncidentHistoryPage() {
  const [hazards, setHazards] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      safetyService.listMyHazards({ limit: 50 }),
      safetyService.listMyIncidents({ limit: 50 }),
    ])
      .then(([hazardData, incidentData]) => {
        setHazards(asArray(hazardData));
        setIncidents(asArray(incidentData).filter((item) => item.title !== 'Tourist has remained in the same area for an extended period'));
      })
      .catch((e) => setError(e?.response?.data?.error?.message || 'Unable to load report history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      <div className="flex justify-between gap-3 items-start">
        <div className="min-w-0">
          <h1 className="text-[20px] sm:text-2xl leading-tight font-black">Safety Reports & Incidents</h1>
          <p className="text-[12px] sm:text-sm leading-relaxed text-slate-500 mt-1">Reports submitted from this tourist account.</p>
        </div>
        <Link to="/tourist/incidents/report" className="shrink-0 px-3 sm:px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] sm:text-xs font-black h-fit whitespace-nowrap">Report New</Link>
      </div>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <section>
        <h2 className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Emergency incidents / SOS</h2>
        <div className="space-y-3">
          {incidents.length === 0 && <Empty text="No SOS incidents." />}
          {incidents.map((item) => <Card key={item.id} icon={ShieldAlert} title={item.title || 'Emergency incident'} status={item.status} meta={new Date(item.createdAt).toLocaleString()} detail={item.description || item.sourceType} />)}
        </div>
      </section>

      <section>
        <h2 className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Safety concern reports</h2>
        <div className="space-y-3">
          {hazards.length === 0 && <Empty text="No hazard reports." />}
          {hazards.map((item) => <Card key={item.id} icon={AlertTriangle} title={item.title} status={item.status} meta={new Date(item.createdAt).toLocaleString()} detail={item.locationName || item.description} />)}
        </div>
      </section>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl text-[12px] sm:text-sm text-slate-500">{text}</div>;
}

function Card({ icon: Icon, title, status, meta, detail }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex gap-2.5 sm:gap-3 min-w-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-black text-[13px] sm:text-sm leading-snug break-words">{title}</h3>
            <p className="text-[11px] sm:text-xs leading-relaxed text-slate-500 mt-1 break-words">{detail}</p>
            <p className="text-[10px] text-slate-400 mt-2">{meta}</p>
          </div>
        </div>
        <span className="shrink-0 text-[9px] sm:text-[10px] font-black uppercase bg-slate-100 rounded-full px-2.5 sm:px-3 py-1 h-fit">{status}</span>
      </div>
    </div>
  );
}
