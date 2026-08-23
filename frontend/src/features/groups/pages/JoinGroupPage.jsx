import React, { useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../api/groupService';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await groupService.joinGroup(token.trim());
      navigate('/tourist/trips/current', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Could not join group');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <Users className="w-9 h-9 text-indigo-600" />
        <h1 className="text-2xl font-black mt-4">Join Trip Group</h1>
        <p className="text-sm text-slate-500 mt-2">Paste the secure invite token shared by the group leader.</p>
        {error && <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <textarea
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste invitation token"
            className="w-full min-h-28 border border-slate-200 rounded-xl p-4 text-sm font-mono"
          />
          <button disabled={busy} className="w-full py-3 rounded-lg bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Join Group
          </button>
        </form>
      </div>
    </div>
  );
}
