import React, { useState, useEffect } from 'react';
import { 
  BarChart4, Clock, AlertOctagon, 
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
      const to = new Date();
      const from = new Date(to);
      from.setUTCDate(from.getUTCDate() - 29);

      const range = {
        from: from.toISOString(),
        to: to.toISOString(),
      };

      const [incidentAnalytics, responseTimes] = await Promise.all([
        authorityService.getIncidentAnalytics(range),
        authorityService.getResponseTimeAnalytics(range),
      ]);

      const totalIncidents = Object.values(incidentAnalytics?.byStatus || {})
        .reduce((sum, count) => sum + count, 0);

      setData({
        jurisdiction: incidentAnalytics?.jurisdiction || responseTimes?.jurisdiction || null,
        totalIncidents,
        byStatus: incidentAnalytics?.byStatus || {},
        resolvedIncidents: Number(incidentAnalytics?.byStatus?.RESOLVED || 0),
        activeIncidents:
          Number(incidentAnalytics?.byStatus?.OPEN || 0) +
          Number(incidentAnalytics?.byStatus?.ACKNOWLEDGED || 0) +
          Number(incidentAnalytics?.byStatus?.IN_PROGRESS || 0),
        dailyVolume: incidentAnalytics?.dailyVolume || [],
        responseTimes: {
          average: responseTimes?.incidents?.responseStartMinutes ?? null,
          distribution: responseTimes?.incidents?.distribution || [],
          slaUnderFiveMinutesPercent:
            responseTimes?.incidents?.slaUnderFiveMinutesPercent ?? 0,
          respondedCount: responseTimes?.incidents?.respondedCount ?? 0,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch analytics');
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
            Backend-derived incident volume and response performance{data?.jurisdiction ? ` for ${data.jurisdiction}` : ''}.
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertOctagon className="w-24 h-24 text-slate-900" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Incidents (30d)</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-slate-900 leading-none tracking-tighter">{data.totalIncidents}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-1.5">Live DB</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertOctagon className="w-24 h-24 text-emerald-900" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Resolved Incidents</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-emerald-700 leading-none tracking-tighter">{data.resolvedIncidents}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-1.5">{data.activeIncidents} active</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Clock className="w-24 h-24 text-indigo-900" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Avg Response Time</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-slate-900 leading-none tracking-tighter">{data.responseTimes.average ?? '—'}{data.responseTimes.average != null && <span className="text-[20px] ml-1 text-slate-500">m</span>}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mb-1.5">{data.responseTimes.respondedCount} responded</span>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-xl border border-indigo-700 shadow-sm text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-24 h-24 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mb-1 relative z-10">SLA Compliance</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-[40px] font-black text-white leading-none tracking-tighter">{data.responseTimes.slaUnderFiveMinutesPercent}%</span>
                <span className="text-[12px] font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded mb-1.5">Target: 95%</span>
              </div>
            </div>
          </div>

          {/* Backend-integrated charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
                    Incident Volume by Day
                  </h3>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    Last 30 days from incident records
                  </p>
                </div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {data.totalIncidents} incidents
                </span>
              </div>

              {data.dailyVolume.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[11px] font-semibold text-slate-400">
                  No incident records in this period.
                </div>
              ) : (
                <div className="flex-1 flex items-end gap-1.5 border-b border-l border-slate-100 pb-2 pl-2">
                  {(() => {
                    const maxCount = Math.max(
                      1,
                      ...data.dailyVolume.map((item) => Number(item.count) || 0),
                    );

                    return data.dailyVolume.map((item, index) => {
                      const height =
                        item.count === 0
                          ? 3
                          : Math.max(8, (item.count / maxCount) * 100);
                      const showLabel =
                        index === 0 ||
                        index === data.dailyVolume.length - 1 ||
                        index % 7 === 0;

                      return (
                        <div
                          key={item.date}
                          className="group relative flex h-full min-w-0 flex-1 items-end"
                        >
                          <div
                            className="w-full rounded-t-sm bg-indigo-200 transition-colors hover:bg-indigo-500"
                            style={{ height: `${height}%` }}
                          />

                          <div className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[9px] font-bold text-white group-hover:block">
                            {item.date}: {item.count}
                          </div>

                          {showLabel && (
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">
                              {item.date.slice(5)}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
              <div className="mb-5">
                <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
                  Response Time Distribution
                </h3>
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  Time from incident creation to response start
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-4">
                {data.responseTimes.distribution.map((bucket) => {
                  const barClass =
                    bucket.key === 'UNDER_2'
                      ? 'bg-emerald-500'
                      : bucket.key === 'TWO_TO_FIVE'
                        ? 'bg-indigo-500'
                        : bucket.key === 'FIVE_TO_TEN'
                          ? 'bg-amber-500'
                          : 'bg-red-500';

                  return (
                    <div key={bucket.key}>
                      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase text-slate-600">
                        <span>{bucket.label}</span>
                        <span>
                          {bucket.percentage}% · {bucket.count}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-2.5 rounded-full transition-all ${barClass}`}
                          style={{ width: `${Math.min(100, bucket.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {data.responseTimes.distribution.length === 0 && (
                  <div className="text-center text-[11px] font-semibold text-slate-400">
                    No responded incidents in this period.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
