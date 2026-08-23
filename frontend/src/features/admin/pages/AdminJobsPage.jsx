import React, { useState } from 'react';
import { 
  Activity, Play, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, Target, Loader2
} from 'lucide-react';
import { adminService } from '../api/adminService';

export function AdminJobsPage() {
  const [runningJob, setRunningJob] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [{ time: new Date().toISOString(), message, type }, ...prev].slice(0, 50));
  };

  const handleTrigger = async (jobName, apiMethod) => {
    if (runningJob) return;
    
    setRunningJob(jobName);
    addLog(`Initiating manual run of ${jobName}...`, 'info');
    
    try {
      const response = await apiMethod();
      addLog(`${jobName} completed successfully. Processes affected: ${response?.count || 'Multiple'}`, 'success');
    } catch (err) {
      addLog(`${jobName} failed: ${err.response?.data?.error?.message || err.message}`, 'error');
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="font-sans max-w-[1200px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">System Admin</span>
          </div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-slate-800" /> Background Sweeps
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Manually trigger and monitor asynchronous platform tasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Job Triggers */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Incident Escalation Sweep</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-1">
                  Finds unacknowledged high-priority SOS incidents and escalates them to all available command personnel. Usually runs via CRON every 5 minutes.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> Last run: 4 minutes ago
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleTrigger('Incident Escalation Sweep', adminService.triggerEscalationRun)}
              disabled={runningJob !== null}
              className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              {runningJob === 'Incident Escalation Sweep' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Sweep
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Trip Monitoring Sweep</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-1">
                  Evaluates all active tourist trips against current risk zones and advanced monitoring policies. Usually runs via CRON every 10 minutes.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> Last run: 9 minutes ago
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleTrigger('Trip Monitoring Sweep', adminService.triggerMonitoringSweep)}
              disabled={runningJob !== null}
              className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              {runningJob === 'Trip Monitoring Sweep' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Sweep
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Notification Retry Queue</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-1">
                  Processes failed SMS/Push delivery jobs that are marked as retryable. Usually runs via CRON every 15 minutes.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> Last run: 2 minutes ago
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleTrigger('Notification Retry Queue', adminService.triggerNotificationSweep)}
              disabled={runningJob !== null}
              className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              {runningJob === 'Notification Retry Queue' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Queue
            </button>
          </div>

        </div>

        {/* Execution Logs */}
        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-[500px]">
          <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Execution Logs</h3>
            {runningJob && <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>}
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-10">Awaiting manual job trigger...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-500 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-emerald-400' :
                    'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
