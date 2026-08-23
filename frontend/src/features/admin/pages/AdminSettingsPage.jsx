import React, { useState } from 'react';
import { 
  Settings, ShieldCheck, Key, Database, Globe, 
  Bell, Save, CheckCircle2, Server, KeyRound, Smartphone
} from 'lucide-react';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('security');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
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
            <Settings className="w-6 h-6 text-slate-800" /> Platform Settings
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Global configurations, security policies, and API access management.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving || saved}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
            saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved Successfully</>
          ) : isSaving ? (
            <div className="flex gap-2 items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</div>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1 sticky top-24">
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'security' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Security & Auth
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'api' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Key className={`w-4 h-4 ${activeTab === 'api' ? 'text-indigo-600' : 'text-slate-400'}`} />
              API Keys & Webhooks
            </button>
            <button 
              onClick={() => setActiveTab('infra')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'infra' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Server className={`w-4 h-4 ${activeTab === 'infra' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Infrastructure
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Global Alerts
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <KeyRound className="w-4 h-4 text-slate-400" /> Two-Factor Authentication (2FA)
                </h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">Require 2FA for System Admins</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Enforce multi-factor auth for all platform administrators.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg mt-4">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">Require 2FA for Disaster Managers</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Enforce multi-factor auth for command center personnel.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Network Security
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Admin Panel IP Allowlist</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-[13px] font-mono text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      rows="3"
                      defaultValue={"192.168.1.0/24\n10.0.0.1"}
                      placeholder="Enter IP ranges (CIDR notation), one per line"
                    ></textarea>
                    <p className="text-[11px] font-medium text-slate-500 mt-1.5">Leave blank to allow access from any IP address (Not recommended).</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <h4 className="text-[13px] font-bold text-red-900">Strict Rate Limiting</h4>
                      <p className="text-[11px] font-medium text-red-700 mt-0.5">Aggressive defense against DDoS & brute-force on auth routes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-red-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" /> Active API Keys
                </h3>
                <button className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-slate-800">
                  Generate Key
                </button>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">Kumbh Mela App Integration (Read/Write)</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">qk_prod_8f92j...f82910d</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest rounded">Active</span>
                    <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded hover:text-red-600">Revoke</button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-between opacity-50">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">Legacy SMS Gateway (Read-Only)</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">qk_legacy_38f2...331941</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 border border-slate-300 text-[10px] font-bold uppercase tracking-widest rounded">Revoked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'infra' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
              <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <Database className="w-4 h-4 text-slate-400" /> Database & Storage
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Automated Backup Frequency</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    <option>Every 6 Hours</option>
                    <option>Every 12 Hours</option>
                    <option>Daily (Midnight)</option>
                    <option>Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Data Retention Policy</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    <option>30 Days (Compliance Minimum)</option>
                    <option>90 Days</option>
                    <option>1 Year</option>
                    <option>Indefinitely</option>
                  </select>
                  <p className="text-[11px] font-medium text-slate-500 mt-1.5">Applies to tourist tracking logs and resolved SOS incidents.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
               <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                <Globe className="w-4 h-4 text-slate-400" /> Broadcast Configurations
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex gap-3 items-center">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900">Push Notifications (FCM/APNS)</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Enable platform-wide push alerts to mobile devices.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex gap-3 items-center">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900">Automated SMS Fallback</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">Send critical SOS updates via SMS if push delivery fails.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
