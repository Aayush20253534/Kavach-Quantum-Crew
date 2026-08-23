import React, { useState } from 'react';
import { Activity, Loader2, Play, RefreshCw } from 'lucide-react';

import { adminService } from '../api/adminService';

const jobs = [
  {
    name: 'Incident Escalation Sweep',
    description: 'Runs the real incident escalation processor.',
    action: adminService.triggerEscalationRun,
  },
  {
    name: 'Trip Monitoring Sweep',
    description: 'Runs the real active-trip monitoring and geofence sweep.',
    action: adminService.triggerMonitoringSweep,
  },
  {
    name: 'Notification Retry Queue',
    description: 'Processes due notification delivery retries.',
    action: adminService.triggerNotificationSweep,
  },
];

export function AdminJobsPage() {
  const [running, setRunning] = useState('');
  const [logs, setLogs] = useState([]);

  const trigger = async (job) => {
    setRunning(job.name);
    setLogs((current) => [
      { at: new Date(), type: 'info', text: `Starting ${job.name}` },
      ...current,
    ]);

    try {
      const result = await job.action();
      setLogs((current) => [
        {
          at: new Date(),
          type: 'success',
          text: `${job.name} completed: ${JSON.stringify(result)}`,
        },
        ...current,
      ]);
    } catch (error) {
      setLogs((current) => [
        {
          at: new Date(),
          type: 'error',
          text:
            error?.response?.data?.error?.message ||
            `${job.name} failed`,
        },
        ...current,
      ]);
    } finally {
      setRunning('');
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-10 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
          System Admin
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6" /> Background Sweeps
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manual execution of the same backend processors used by scheduled jobs.
        </p>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.name}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h2 className="font-black text-sm">{job.name}</h2>
              <p className="text-xs text-slate-500 mt-1">{job.description}</p>
            </div>
            <button
              type="button"
              disabled={Boolean(running)}
              onClick={() => trigger(job)}
              className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {running === job.name ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Execution results
        </div>
        <div className="p-4 min-h-52 max-h-80 overflow-y-auto font-mono text-[11px] space-y-2">
          {logs.length === 0 ? (
            <p className="text-slate-600">No manual job has been run in this browser session.</p>
          ) : (
            logs.map((entry, index) => (
              <p
                key={`${entry.at.getTime()}-${index}`}
                className={
                  entry.type === 'error'
                    ? 'text-red-400'
                    : entry.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                }
              >
                [{entry.at.toLocaleTimeString()}] {entry.text}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
