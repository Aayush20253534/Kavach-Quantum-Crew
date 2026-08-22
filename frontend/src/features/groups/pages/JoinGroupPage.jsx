import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
} from 'lucide-react';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const handleSimulateScan = () => {
    setInviteCode('KAVACH-PRY-8924');
    setJoinedSuccess(true);
    setTimeout(() => {
      navigate('/tourist/groups/create');
    }, 1500);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinedSuccess(true);
    setTimeout(() => {
      navigate('/tourist/groups/create');
    }, 1500);
  };

  return (
    <div className="max-w-[600px] mx-auto space-y-6 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Join Safety Circle</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Scan your group leader's QR code or enter the invite code manually.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 sm:p-10 space-y-8 text-center">
          {!joinedSuccess ? (
            <>
              {/* Simulated Camera Viewfinder */}
              <div className="relative mx-auto w-full max-w-[280px] aspect-square rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-lg">
                {/* Laser scan line animation */}
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#16a34a] to-transparent top-1/4 animate-[bounce_2s_infinite]" />

                {/* Viewfinder Target corners */}
                <div className="w-48 h-48 border-2 border-[#16a34a]/80 rounded-md relative flex items-center justify-center p-4">
                  <div className="w-full h-full border border-dashed border-[#16a34a]/40 rounded flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Camera className="w-8 h-8 text-[#16a34a] animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-300">Point Camera at QR Code</span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-center z-10">
                  <button
                    onClick={handleSimulateScan}
                    className="w-full py-2.5 rounded-md bg-[#16a34a] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#15803d] transition-colors cursor-pointer shadow-md"
                  >
                    Simulate Camera Scan
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Enter Code</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4 text-left max-w-sm mx-auto">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Invite Code</label>
                  <input
                    type="text"
                    placeholder="e.g. KAVACH-PRY-8924"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] font-semibold rounded-md px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inviteCode.trim()}
                  className="w-full group flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-widest rounded-md disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                >
                  Join Circle
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </>
          ) : (
            <div className="py-12 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Joined Successfully!</h3>
                <p className="text-[14px] text-slate-500 max-w-md mx-auto font-medium">
                  Connected to <strong className="text-slate-800">Maurya Pilgrimage Group</strong>. Syncing real-time safety radar...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
