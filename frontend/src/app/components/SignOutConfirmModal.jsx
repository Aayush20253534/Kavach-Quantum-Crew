import React from 'react';
import { LogOut, X } from 'lucide-react';

export function SignOutConfirmModal({ open, busy = false, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.();
      }}
    >
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close sign out confirmation"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <LogOut className="h-5 w-5" />
          </div>

          <h2 id="signout-dialog-title" className="mt-4 text-[17px] font-black tracking-tight text-slate-950">
            Sign out of KAVACH?
          </h2>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
            Your current session will end on this device. You can sign in again at any time.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-10 rounded-xl border border-slate-200 bg-white text-[11px] font-black uppercase tracking-[0.08em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="h-10 rounded-xl bg-rose-600 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
