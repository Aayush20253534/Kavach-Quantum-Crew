import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Terminal, Shield, 
  Search, Filter, Loader2, ServerCrash
} from 'lucide-react';
import { adminService } from '../api/adminService';

export function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAuditLogs();
      const data = response?.data || response || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
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
            <Activity className="w-6 h-6 text-slate-800" /> Audit & Diagnostics
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Platform observability, system logs, and security trails.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Col: Diagnostic Stats (Placeholder) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 text-white shadow-sm">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
               <Database className="w-4 h-4 text-emerald-400" /> DB Connection
             </div>
             <p className="text-[24px] font-black tracking-tight text-emerald-400">HEALTHY</p>
             <p className="text-[11px] font-medium text-slate-400 mt-1">Latency: 14ms</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
               <Shield className="w-4 h-4 text-indigo-500" /> API Gateway
             </div>
             <p className="text-[24px] font-black tracking-tight text-slate-900">99.98%</p>
             <p className="text-[11px] font-medium text-slate-500 mt-1">Uptime SLA (30d)</p>
          </div>
        </div>

        {/* Right Col: Logs Table */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" /> System Audit Trail
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-950 font-mono p-4">
            {error ? (
               <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                 <ServerCrash className="w-8 h-8 text-red-500 mb-3" />
                 <p className="text-red-500 font-bold text-sm mb-1">Failed to read log stream</p>
                 <p className="text-red-400/70 text-xs">{error}</p>
               </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-10 h-full text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-3" />
                <p className="text-xs">Tailing audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-[12px] text-slate-600 mt-10">No recent audit logs.</p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="text-[11px] leading-relaxed flex items-start hover:bg-slate-900 px-2 py-1 -mx-2 rounded transition-colors break-all">
                    <span className="text-slate-500 shrink-0 w-32 select-none">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </span>
                    <span className={`shrink-0 w-16 select-none ${
                      log.level === 'ERROR' ? 'text-red-400' : 
                      log.level === 'WARN' ? 'text-amber-400' : 
                      'text-blue-400'
                    }`}>
                      [{log.level || 'INFO'}]
                    </span>
                    <span className="text-emerald-400 shrink-0 w-48 truncate pr-2 select-none">
                      {log.action || 'SYSTEM_EVENT'}
                    </span>
                    <span className="text-slate-300">
                      {log.details || log.message || JSON.stringify(log)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
