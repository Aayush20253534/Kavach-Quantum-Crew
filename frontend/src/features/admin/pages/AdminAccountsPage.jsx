import React, { useState, useEffect } from 'react';
import { 
  Users, UserX, Shield, ShieldCheck, 
  Search, Filter, ServerCrash, Loader2, MoreVertical
} from 'lucide-react';
import { adminService } from '../api/adminService';

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAccounts();
      const data = response?.data || response || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (accountId, role, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateAccountStatus(role, accountId, { status: newStatus });
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
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
            <Users className="w-6 h-6 text-slate-800" /> Account Management
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Platform-wide identity and access administration.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 rounded-md bg-white text-slate-900 shadow-sm text-[11px] font-bold uppercase tracking-wider transition-all">
            All Accounts
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 rounded-md text-slate-500 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all">
            Authorities
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 rounded-md text-slate-500 hover:text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all">
            Suspended
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[12px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
          <ServerCrash className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-red-800 font-bold text-sm mb-1">Infrastructure Error</p>
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {!error && loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-4" />
          <p className="text-sm font-semibold text-slate-500">Querying identity provider...</p>
        </div>
      ) : !error && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Account</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 text-[12px]">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                            {acc.name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900">{acc.name || 'Unknown User'}</p>
                            <p className="text-[11px] font-medium text-slate-500">{acc.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {acc.role === 'SYSTEM_ADMIN' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                          ) : acc.role === 'DISASTER_MANAGER' ? (
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                          ) : null}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {acc.role || 'TOURIST'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${
                          acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          acc.status === 'SUSPENDED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {acc.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-medium text-slate-500">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleStatusChange(acc.id, acc.role, acc.status)}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            acc.status === 'ACTIVE' 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {acc.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
