import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { credentialService } from '../api/credentialService';

export function CredentialVerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    credentialService.verify(token).then(setData).catch((e) => {
      setError(e?.response?.data?.error?.message || 'This credential is invalid or expired.');
    });
  }, [token]);

  if (!data && !error) return <div className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>;

  const valid = Boolean(data?.valid);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:py-20">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 place-items-center rounded-xl ${valid ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {valid ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Kavach Credential</p>
            <h1 className="text-xl font-black text-slate-950">{error ? 'Verification failed' : valid ? 'Verified' : 'Not valid'}</h1>
          </div>
        </div>

        {error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : (
          <div className="mt-6 space-y-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{data.type === 'GROUP' ? 'Group ID' : 'Individual ID'}</p>
              <p className="mt-1 font-mono font-bold text-slate-900">{data.publicId}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Trip" value={data.trip?.locationName} />
              <Info label="Trip status" value={data.trip?.status} />
              <Info label="Expires" value={new Date(data.expiresAt).toLocaleString()} />
              <Info label="Members" value={data.type === 'GROUP' ? String(data.memberCount ?? 0) : 'Individual'} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4">
              <ShieldCheck className={`h-5 w-5 ${data.blockchain?.verified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="text-xs font-black text-slate-900">Blockchain {data.blockchain?.verified ? 'verified' : data.blockchain?.status}</p>
                <p className="text-[10px] text-slate-500">No personal data is stored on-chain.</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xs font-bold text-slate-800">{value || '—'}</p></div>;
}
