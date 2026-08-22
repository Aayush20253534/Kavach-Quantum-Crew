import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  QrCode, 
  Camera, 
  Upload, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  Sparkles 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const handleSimulateScan = () => {
    setInviteCode('KAVACH-PRY-8924');
    setJoinedSuccess(true);
    setTimeout(() => {
      navigate('/tourist/groups/create');
    }, 1200);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinedSuccess(true);
    setTimeout(() => {
      navigate('/tourist/groups/create');
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Join Family / Group Circle</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scan your leader's QR code or enter the invite code manually.
          </p>
        </div>
      </div>

      <Card variant="elevated" className="border-slate-800">
        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          {!joinedSuccess ? (
            <>
              {/* Simulated Camera Viewfinder */}
              <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-3xl bg-[#060b16] border-2 border-slate-700 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
                {/* Laser scan line animation */}
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/4 animate-bounce" />

                {/* Viewfinder Target corners */}
                <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center p-4">
                  <div className="w-full h-full border border-dashed border-emerald-500/40 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Camera className="w-8 h-8 text-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-300">Point Camera at QR Code</span>
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <button
                    onClick={handleSimulateScan}
                    className="w-full py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    Tap Here to Simulate Successful Scan
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Or Enter Code Manually</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-3 text-left">
                <Input
                  label="6 to 14 Character Invite Code"
                  placeholder="e.g. KAVACH-PRY-8924"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inviteCode.trim()}
                  className="w-full"
                  rightIcon={ArrowRight}
                >
                  Join Safety Circle
                </Button>
              </form>
            </>
          ) : (
            <div className="py-8 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Joined Group Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Connected to <strong>Maurya Pilgrimage Group</strong>. Syncing real-time safety radar...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
