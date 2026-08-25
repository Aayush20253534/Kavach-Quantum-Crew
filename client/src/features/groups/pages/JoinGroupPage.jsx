import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock3, ImageUp, Loader2, ShieldCheck, Users, X, AlertTriangle, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { groupService } from '../api/groupService';

const READER_ID = 'kavach-group-qr-reader';

const normalizePayload = (raw) => {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('KAVACH_GROUP_JOIN:')) return value.slice('KAVACH_GROUP_JOIN:'.length).trim();
  try {
    const url = new URL(value, window.location.origin);
    if (url.pathname.endsWith('/tourist/groups/join')) return url.searchParams.get('token') || '';
  } catch {}
  return '';
};

export function JoinGroupPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [groupQrToken, setGroupQrToken] = useState('');
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [joinRequest, setJoinRequest] = useState(null);

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      if (runningRef.current) await scannerRef.current.stop();
    } catch {}
    try { await scannerRef.current.clear(); } catch {}
    scannerRef.current = null;
    runningRef.current = false;
    setCameraOpen(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  useEffect(() => {
    if (!joinRequest?.requestId || joinRequest.status !== 'PENDING') return undefined;
    let cancelled = false;
    const check = async () => {
      try {
        const next = await groupService.getJoinRequestStatus(joinRequest.requestId);
        if (cancelled) return;
        setJoinRequest(next);
        if (next.status === 'APPROVED') {
          window.setTimeout(() => navigate('/tourist/trips/current', { replace: true }), 700);
        }
      } catch {}
    };
    const timer = window.setInterval(check, 4000);
    check();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [joinRequest?.requestId, joinRequest?.status, navigate]);

  const handleDecoded = async (decodedText) => {
    const qrToken = normalizePayload(decodedText);
    if (!qrToken) {
      setError('This is not a valid Kavach group QR code.');
      return;
    }
    await stopScanner();
    setGroupQrToken(qrToken);
    setBusy(true);
    setError('');
    try {
      const data = await groupService.previewJoinGroupByQr(qrToken);
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setError(e?.response?.data?.error?.message || e.message || 'Unable to validate this group QR.');
    } finally {
      setBusy(false);
    }
  };


  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || groupQrToken || preview || joinRequest) return;
    handleDecoded(`${window.location.origin}/tourist/groups/join?token=${encodeURIComponent(token)}`);
    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCamera = async () => {
    setError('');
    setPreview(null);
    setStarting(true);
    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      setCameraOpen(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (text) => { await handleDecoded(text); },
        () => {}
      );
      runningRef.current = true;
    } catch (e) {
      await stopScanner();
      setError('Unable to access the camera. Check browser permission or use Upload QR Image.');
    } finally {
      setStarting(false);
    }
  };

  const uploadQr = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setPreview(null);
    setBusy(true);
    try {
      const scanner = new Html5Qrcode('kavach-hidden-reader', { verbose: false });
      const text = await scanner.scanFile(file, true);
      await scanner.clear().catch(() => {});
      await handleDecoded(text);
    } catch {
      setError('Could not read a QR code from that image.');
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  const confirmJoin = async () => {
    if (!groupQrToken) return;
    setBusy(true);
    setError('');
    try {
      const request = await groupService.joinGroupByQr(groupQrToken);
      setJoinRequest(request);
      setPreview(null);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Could not send this join request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Camera className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-black">Join Trip</h1>
            <p className="text-sm text-slate-500 mt-1">Scan the group QR shared by your trip leader.</p>
          </div>
        </div>

        {error && <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

        {!preview && !joinRequest && (
          <div className="mt-6 space-y-3">
            <div id={READER_ID} className={`overflow-hidden rounded-xl border ${cameraOpen ? 'border-indigo-300 bg-black min-h-[320px]' : 'hidden'}`} />
            <div id="kavach-hidden-reader" className="hidden" />
            {!cameraOpen ? (
              <button type="button" onClick={openCamera} disabled={starting || busy} className="w-full py-3 rounded-lg bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Scan Group QR
              </button>
            ) : (
              <button type="button" onClick={stopScanner} className="w-full py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"><X className="w-4 h-4" /> Close Camera</button>
            )}
            <label className="w-full py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
              <ImageUp className="w-4 h-4" /> Upload QR Image
              <input type="file" accept="image/*" className="hidden" onChange={uploadQr} disabled={busy} />
            </label>
            <p className="text-center text-[11px] leading-5 text-slate-400">The QR is a normal HTTPS join link, so any QR scanner can open it. Personal details are not embedded in the code.</p>
          </div>
        )}

        {busy && !preview && !joinRequest && <div className="mt-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>}

        {joinRequest && (
          <div className="mt-6">
            {joinRequest.status === 'PENDING' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <Clock3 className="mx-auto h-8 w-8 text-amber-600" />
                <p className="mt-3 font-black text-amber-950">Waiting for leader approval</p>
                <p className="mt-1 text-xs leading-5 text-amber-700">Your QR was valid. The group leader must approve your request before you become a member and receive an individual trip credential.</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking approval automatically
                </div>
              </div>
            )}
            {joinRequest.status === 'APPROVED' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 font-black text-emerald-950">Approved by group leader</p>
                <p className="mt-1 text-xs text-emerald-700">You are now a group member. Opening your current trip…</p>
              </div>
            )}
            {joinRequest.status === 'REJECTED' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                <XCircle className="mx-auto h-8 w-8 text-red-600" />
                <p className="mt-3 font-black text-red-950">Join request declined</p>
                <p className="mt-1 text-xs text-red-700">The group leader did not approve this request.</p>
                <button type="button" onClick={() => { setJoinRequest(null); setGroupQrToken(''); }} className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700">Scan another QR</button>
              </div>
            )}
          </div>
        )}

        {preview && (
          <div className="mt-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-black text-emerald-950">Verified Group ID</p>
                  <p className="mt-1 text-xs text-emerald-700">This group ID hash is valid for an active planned trip. Review the trip before joining.</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white border border-emerald-100 p-3.5 space-y-2">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /><p className="font-bold text-sm text-slate-900">{preview.trip?.locationName || 'Trip Group'}</p></div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-400">Members</p><p className="font-bold mt-0.5">{preview.memberCount}</p></div>
                  <div><p className="text-slate-400">Leader</p><p className="font-bold mt-0.5 truncate">{preview.leader?.name || preview.leader?.username || 'Trip Leader'}</p></div>
                  <div className="col-span-2"><p className="text-slate-400">Trip ends</p><p className="font-bold mt-0.5">{preview.trip?.plannedEndAt ? new Date(preview.trip.plannedEndAt).toLocaleString() : '—'}</p></div>
                  <div className="col-span-2"><p className="text-slate-400">Group QR expires</p><p className="font-bold mt-0.5">{new Date(preview.qrExpiresAt).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => { setPreview(null); setGroupQrToken(''); }} disabled={busy} className="flex-1 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-black text-xs uppercase tracking-wider">Scan Again</button>
              <button type="button" onClick={confirmJoin} disabled={busy} className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Request to Join
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
