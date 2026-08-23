import React, { useState, useEffect } from 'react';
import { 
  Puzzle, Bot, Link, CheckCircle2, XCircle, 
  Loader2, ServerCrash, RefreshCw, Key
} from 'lucide-react';
import { adminService } from '../api/adminService';

export function AdminIntegrationsPage() {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('AI');

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const fetchCapabilities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getIntegrations();
      setCapabilities(response?.data || response || { 
        ai: { provider: 'Not Configured', status: 'INACTIVE', models: [] }, 
        blockchain: { provider: 'Not Configured', status: 'INACTIVE', network: 'N/A' } 
      });
    } catch (err) {
      if (err.response?.status === 501) {
        // Mock default for unconfigured state as defined in ENDPOINTS.md
        setCapabilities({
          ai: { provider: 'Gemini (Pending)', status: 'INACTIVE', capabilities: ['Risk Assessment', 'Hazard Analysis'] },
          blockchain: { provider: 'Polygon (Pending)', status: 'INACTIVE', capabilities: ['Safety ID Proofs', 'Evidence Verification'] }
        });
      } else {
        setError(err.message || 'Failed to fetch integration capabilities');
      }
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
            <Puzzle className="w-6 h-6 text-slate-800" /> Integrations Hub
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Manage third-party AI models and Blockchain network providers.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1 sticky top-24">
            <button 
              onClick={() => setActiveTab('AI')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'AI' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Bot className={`w-4 h-4 ${activeTab === 'AI' ? 'text-indigo-600' : 'text-slate-400'}`} />
              AI Providers
            </button>
            <button 
              onClick={() => setActiveTab('BLOCKCHAIN')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left ${activeTab === 'BLOCKCHAIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border shadow-sm' : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Link className={`w-4 h-4 ${activeTab === 'BLOCKCHAIN' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Blockchain Networks
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {error && (
            <div className="p-10 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center text-center">
              <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-red-800 font-bold text-sm mb-1">Integration Engine Error</p>
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {!error && loading ? (
             <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
               <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
               <p className="text-sm font-semibold text-slate-500">Querying providers...</p>
             </div>
          ) : !error && capabilities && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
              
              {activeTab === 'AI' && (
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Bot className="w-4 h-4 text-slate-400" /> Active AI Engine
                    </h3>
                    {capabilities.ai?.status === 'ACTIVE' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Disconnected</span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Primary Provider</label>
                      <div className="flex gap-2">
                        <select className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                          <option>Google Gemini (Recommended)</option>
                          <option>OpenAI GPT-4</option>
                          <option>Anthropic Claude</option>
                        </select>
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">
                          Configure
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-3">Supported Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {(capabilities.ai?.capabilities || ['Risk Assessment', 'Hazard Analysis', 'Chatbot Widget']).map(cap => (
                          <span key={cap} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[11px] font-bold">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'BLOCKCHAIN' && (
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                    <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Link className="w-4 h-4 text-slate-400" /> Immutable Ledgers
                    </h3>
                    {capabilities.blockchain?.status === 'ACTIVE' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Syncing</span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Unconfigured</span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Network Provider</label>
                      <div className="flex gap-2">
                        <select className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                          <option>Polygon (Mainnet)</option>
                          <option>Ethereum (Sepolia Testnet)</option>
                          <option>Hyperledger Fabric (Private)</option>
                        </select>
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <Key className="w-3.5 h-3.5" /> Connect Wallet
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-2">
                        Connecting to a public ledger incurs gas fees. Ensure the treasury wallet is funded.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-3">Smart Contract References</h4>
                      <div className="space-y-2">
                         <div className="flex items-center justify-between p-3 border border-slate-200 rounded bg-white">
                           <span className="text-[11px] font-bold text-slate-700 uppercase">Safety ID Proofs</span>
                           <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">0xNotDeployed</span>
                         </div>
                         <div className="flex items-center justify-between p-3 border border-slate-200 rounded bg-white">
                           <span className="text-[11px] font-bold text-slate-700 uppercase">Incident Evidence</span>
                           <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">0xNotDeployed</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
