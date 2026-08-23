import React, { useState, useEffect } from 'react';
import { 
  BarChart4, TrendingUp, Clock, AlertOctagon, 
  Loader2, ServerCrash, Calendar, Download, Target
} from 'lucide-react';
import { authorityService } from '../api/authorityService';

export function AuthorityAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [overview, responseTimes, incidentAnalytics, responderAnalytics] = await Promise.all([
        authorityService.getAnalyticsOverview(),
        authorityService.getResponseTimeAnalytics(),
        authorityService.getIncidentAnalytics(),
        authorityService.getResponderAnalytics(),
      ]);
      const totalIncidents = Object.values(incidentAnalytics?.byStatus || {}).reduce((sum, count) => sum + count, 0);
      const resolvedIncidents = incidentAnalytics?.byStatus?.RESOLVED || 0;
      const activeResponders = Object.entries(responderAnalytics?.byAvailability || {})
        .filter(([status]) => status !== 'OFF_DUTY')
        .reduce((sum, [, count]) => sum + count, 0);
      const average = responseTimes?.incidents?.responseStartMinutes ?? null;
      setData({
        overview: { ...overview, totalIncidents, resolvedIncidents, activeResponders },
        responseTimes: { average, target: 5, percentUnderTarget: average == null ? null : (average <= 5 ? 100 : 0) },
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Command Center</span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <BarChart4 className="w-6 h-6 text-indigo-600" /> Operational Analytics
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Performance metrics, response SLAs, and historical data.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-red-800 font-bold text-sm mb-1">Analytics Engine Error</p>
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
          <p className="text-sm font-semibold text-slate-500">Aggregating operational data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertOctagon className="w-24 h-24 text-slate-900" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Incidents (30d)</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-slate-900 leading-none tracking-tighter">{data.overview.totalIncidents}</span>
                <span className="text-[12px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded flex items-center mb-1.5"><TrendingUp className="w-3 h-3 mr-1" /> 12%</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Clock className="w-24 h-24 text-indigo-900" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Avg Response Time</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-slate-900 leading-none tracking-tighter">{data.responseTimes.average}<span className="text-[20px] ml-1 text-slate-500">m</span></span>
                <span className="text-[12px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded flex items-center mb-1.5"><TrendingUp className="w-3 h-3 mr-1" /> 0.8m</span>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-xl border border-indigo-700 shadow-sm text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-24 h-24 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mb-1 relative z-10">SLA Compliance</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-white leading-none tracking-tighter">{data.responseTimes.percentUnderTarget}%</span>
                <span className="text-[12px] font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded mb-1.5">Target: 95%</span>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-6">Incident Volume by Day</h3>
              <div className="flex-1 flex items-end gap-2 border-b border-l border-slate-100 pb-2 pl-2">
                 {/* Fake Bar Chart */}
                 {[40, 25, 60, 45, 80, 55, 30, 90, 65, 40, 75, 50, 20, 85].map((height, i) => (
                   <div key={i} className="flex-1 bg-indigo-100 hover:bg-indigo-200 rounded-t-sm relative group transition-colors" style={{ height: `${height}%` }}>
                     <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity">
                       {height * 2}
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-6">Response Time Distribution</h3>
              <div className="flex-1 flex flex-col justify-center gap-4">
                 {/* Fake Progress Bars */}
                 <div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase mb-1">
                     <span>&lt; 2 Minutes</span>
                     <span>45%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5">
                     <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase mb-1">
                     <span>2 - 5 Minutes</span>
                     <span>37%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5">
                     <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '37%' }}></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase mb-1">
                     <span>5 - 10 Minutes</span>
                     <span>12%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5">
                     <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase mb-1">
                     <span>&gt; 10 Minutes</span>
                     <span>6%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5">
                     <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '6%' }}></div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
