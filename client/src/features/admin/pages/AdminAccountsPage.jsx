import React, { useEffect, useState } from 'react';
import {
  Loader2,
  Search,
  ServerCrash,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { adminService } from '../api/adminService';

const filters = [
  ['ALL', 'All identities'],
  ['DISASTER_MANAGER', 'Disaster Management'],
  ['FLEETS', 'Emergency fleets'],
  ['SUSPENDED', 'Suspended'],
];

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search.trim() || undefined,
        limit: 100,
      };
      if (filter === 'DISASTER_MANAGER') params.role = filter;
      if (filter === 'SUSPENDED') params.status = filter;

      const result = filter === 'FLEETS'
        ? (await Promise.all(['POLICE', 'AMBULANCE', 'FIRE'].map((role) => adminService.getAccounts({ ...params, role })))).flat()
        : await adminService.getAccounts(params);
      setAccounts(Array.isArray(result) ? result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          requestError?.message ||
          'Failed to fetch accounts.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchAccounts, 250);
    return () => window.clearTimeout(timer);
  }, [filter, search]);

  const changeStatus = async (account) => {
    const status = account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateAccountStatus(account.role, account.id, {
        status,
        reason:
          status === 'SUSPENDED'
            ? 'Changed from system administration console'
            : 'Reactivated from system administration console',
      });
      await fetchAccounts();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Failed to update account status.',
      );
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Identity & Access
        </p>
        <h1 className="mt-1 text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6" /> Account Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review platform identities, operational roles, account state and access activity.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-none-none p-4  flex flex-col sm:flex-row gap-3 justify-between mb-5">
        <div className="flex overflow-x-auto bg-slate-100 rounded-none-none p-1">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`whitespace-nowrap px-4 py-2 rounded-none-none text-[10px] font-black uppercase tracking-wider ${
                filter === value
                  ? 'bg-white  text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, username, email or phone"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-none-none text-xs outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-none-none p-5 text-red-700 text-xs flex gap-3">
          <ServerCrash className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-none-none  overflow-x-auto">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Account', 'Role', 'Status', 'Last Sign-in', 'Created', 'Actions'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <tr key={`${account.role}-${account.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-black text-xs">
                      {account.name || account.username}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {account.email || account.phone}
                    </p>
                    {account.organization && <p className="text-[10px] text-slate-400 mt-1">{account.organization}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 px-2 py-1 inline-flex items-center gap-1">
                      {account.role === 'SYSTEM_ADMIN' ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : account.role === 'DISASTER_MANAGER' ? (
                        <Shield className="w-3 h-3" />
                      ) : null}
                      {account.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold">
                    {account.status}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-500">
                    {account.lastLoginAt
                      ? new Date(account.lastLoginAt).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-500">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => changeStatus(account)}
                      className={`px-3 py-2 rounded-none-none text-[10px] font-black uppercase ${
                        account.status === 'ACTIVE'
                          ? 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                          : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {account.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-xs text-slate-500 text-center">
                    No accounts match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
