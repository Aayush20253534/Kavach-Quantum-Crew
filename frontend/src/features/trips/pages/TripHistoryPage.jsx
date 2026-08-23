import React, { useEffect, useState } from 'react';
import { Clock, Loader2, MapPin } from 'lucide-react';
import { tripService } from '../api/tripService';

export function TripHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    tripService.getTripHistory({ limit: 50 })
      .then((data) => setItems(data?.items || data || []))
      .catch((e) => setError(e?.response?.data?.error?.message || 'Unable to load trip history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-5">
      <div><h1 className="text-2xl font-black">Trip History</h1><p className="text-sm text-slate-500">Completed, cancelled and previous trips from your account.</p></div>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      {items.length === 0 ? <div className="p-10 bg-white border rounded-xl text-center text-slate-500">No previous trips.</div> :
        items.map((trip) => (
          <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-black">{trip.locationName}</h2>
                <p className="text-xs text-slate-500 mt-2"><Clock className="w-3.5 h-3.5 inline mr-1" />{new Date(trip.plannedStartAt).toLocaleString()}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 rounded-full px-3 py-1 h-fit">{trip.status}</span>
            </div>
          </div>
        ))
      }
    </div>
  );
}
