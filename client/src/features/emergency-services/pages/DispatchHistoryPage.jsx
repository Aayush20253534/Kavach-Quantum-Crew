import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { emergencyServicesApi } from '../api/emergencyServicesApi';
import { Loader } from '../../../components/ui/Loader';
import { History, CheckCircle, Search } from 'lucide-react';

export function DispatchHistoryPage() {
  const { theme } = useOutletContext();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        const response = await emergencyServicesApi.getDispatches();
        const allDispatches = response?.data?.data || [];
        const completed = allDispatches.filter(d => ['COMPLETED', 'CANCELLED'].includes(d.status));
        setDispatches(completed);
      } catch (err) {
        console.error('Failed to fetch dispatches:', err);
        // Mock data
        setDispatches([
          {
            id: 'dispatch-hist-1',
            status: 'COMPLETED',
            incident: {
              title: 'Minor Fire at Central Market',
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDispatches();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className={`p-6 rounded-2xl ${theme.bgClass} text-white shadow-lg relative overflow-hidden flex items-center justify-between`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <History className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <History className="w-6 h-6" /> Dispatch History
          </h1>
          <p className="text-white/80 font-medium text-sm mt-1">
            Log of completed and cancelled dispatches.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {dispatches.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No History Found</h3>
            <p className="text-slate-500 font-medium mt-1 text-sm">You have not completed any dispatches yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-slate-500 font-mono">{dispatch.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{dispatch.incident?.title || 'Unknown Incident'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-600">{new Date(dispatch.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(dispatch.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {dispatch.status === 'COMPLETED' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${dispatch.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {dispatch.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
