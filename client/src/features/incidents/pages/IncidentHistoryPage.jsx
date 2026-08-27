import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safetyService } from '../../safety/api/safetyService';

const asArray = (value) => value?.items || value || [];

const humanizeKey = (key) =>
  key
    .replace(/Id$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatStructuredValue = (key, value) => {
  if (value == null || value === '') return null;

  if (/At$|Date$|Time$/i.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return null;

  return String(value).replaceAll('_', ' ');
};

const formatDetail = (detail) => {
  if (!detail) return [];

  let parsed = detail;

  if (typeof detail === 'string') {
    const trimmed = detail.trim();

    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return [{ label: '', value: detail }];
    }

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [{ label: '', value: detail }];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((value) => ({ label: '', value: String(value) }))
      .filter(({ value }) => value);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return [{ label: '', value: String(parsed) }];
  }

  const zone = parsed.zoneName || parsed.locationName;
  if (zone) {
    return [{ label: 'Location', value: String(zone) }];
  }

  return Object.entries(parsed)
    .map(([key, value]) => {
      const formattedValue = formatStructuredValue(key, value);
      if (!formattedValue) return null;

      // Internal identifiers are useful for support, but they should not dominate
      // the mobile incident card. Give them a short, readable label.
      const label = /signalLossCaseId/i.test(key)
        ? 'Case ID'
        : humanizeKey(key);

      return { label, value: formattedValue };
    })
    .filter(Boolean);
};

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
          {incidents.map((item) => <Card key={item.id} icon={ShieldAlert} title={item.title || 'Emergency incident'} status={item.status} meta={new Date(item.createdAt).toLocaleString()} detail={formatDetail(item.description || item.sourceType)} />)}
        </div>
      </section>

      <section>
        <h2 className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Safety concern reports</h2>
        <div className="space-y-3">
          {hazards.length === 0 && <Empty text="No hazard reports." />}
          {hazards.map((item) => <Card key={item.id} icon={AlertTriangle} title={item.title} status={item.status} meta={new Date(item.createdAt).toLocaleString()} detail={formatDetail(item.locationName || item.description)} />)}
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="flex gap-2.5 sm:gap-3 min-w-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-black text-[13px] sm:text-sm leading-snug break-words">{title}</h3>
            {detail?.length > 0 && (
              <div className="mt-2 space-y-1">
                {detail.map(({ label, value }, index) => (
                  <p
                    key={`${label}-${index}`}
                    className="text-[11px] sm:text-xs leading-5 text-slate-500 break-words"
                  >
                    {label && (
                      <span className="font-semibold text-slate-600">
                        {label}:{' '}
                      </span>
                    )}
                    <span className="break-words [overflow-wrap:anywhere]">{value}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5">
              {meta}
            </p>
          </div>
        </div>
        <span className="self-start shrink-0 text-[9px] sm:text-[10px] font-black uppercase bg-slate-100 rounded-full px-2.5 sm:px-3 py-1 h-fit">{status}</span>
      </div>
    </div>
  );
}
