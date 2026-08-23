import React, { useState } from 'react';
import { CheckCircle2, FileUp, Loader2, Link as LinkIcon } from 'lucide-react';
import { safetyService } from '../../safety/api/safetyService';

export function EvidenceUploader({ entityId, entityType, onUploadComplete, disabled = false }) {
  const [state, setState] = useState({ status: 'idle', name: '', error: '' });

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !entityId || disabled) return;

    setState({ status: 'uploading', name: file.name, error: '' });
    try {
      const result = await safetyService.uploadEvidence(file, entityId, entityType);
      setState({ status: 'done', name: file.name, error: '' });
      onUploadComplete?.(result);
    } catch (error) {
      setState({
        status: 'error',
        name: file.name,
        error: error?.response?.data?.error?.message || error.message || 'Upload failed',
      });
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50">
      <label className={`flex items-center gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
        {state.status === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{state.name || 'Attach evidence'}</p>
          <p className="text-[11px] text-slate-500">Stored by the real evidence backend. Blockchain proof is mock-only for now.</p>
        </div>
        <input type="file" className="hidden" disabled={disabled} onChange={upload} />
      </label>

      {state.status === 'done' && (
        <p className="mt-3 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Evidence uploaded.
          <span className="ml-1 inline-flex items-center gap-1 text-indigo-600">
            <LinkIcon className="w-3 h-3" /> Mock blockchain proof pending
          </span>
        </p>
      )}
      {state.error && <p className="mt-3 text-[11px] text-red-600 font-semibold">{state.error}</p>}
    </div>
  );
}
