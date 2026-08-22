import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  ArrowRight, 
  UserPlus,
  BatteryMedium,
  Radio
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';

export function CreateGroupPage() {
  const [groupName, setGroupName] = useState('Maurya Pilgrimage Group');
  const [maxMembers, setMaxMembers] = useState('6');
  const [copied, setCopied] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const inviteCode = 'KAVACH-PRY-8924';
  const inviteLink = `https://kavach-safety.in/join?code=${inviteCode}`;

  const currentMembers = [
    { name: 'Prachi Maurya (You)', role: 'Group Leader', battery: '88%', status: 'Online' },
    { name: 'Aayansh Sharma', role: 'Member', battery: '74%', status: 'Online' },
    { name: 'Kavita Verma', role: 'Member', battery: '92%', status: 'Online' },
    { name: 'Rohan Gupta', role: 'Member', battery: '40%', status: 'Online' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Family & Group Safety Circle</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate dynamic QR codes to sync location and battery stats with companions in Prayagraj.
          </p>
        </div>

        <Link to="/tourist/groups/join">
          <Button variant="outline" size="sm" leftIcon={QrCode}>
            Scan QR to Join Existing
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left 7 Cols: Group QR Code Card */}
        <div className="md:col-span-7 space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dynamic Group Safety QR</CardTitle>
                <Badge variant="safe">ACTIVE · SYNCED</Badge>
              </div>
              <CardDescription>
                Ask companions to scan this code with their phone camera or Kavach app to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              {/* QR Code Container Mockup */}
              <div className="relative mx-auto w-56 h-56 p-4 rounded-3xl bg-white flex flex-col items-center justify-center shadow-2xl shadow-sky-500/10">
                <div className="w-full h-full border-4 border-slate-900 rounded-2xl p-3 flex flex-col items-center justify-between bg-white text-slate-950">
                  <div className="w-full flex justify-between">
                    <div className="w-8 h-8 bg-slate-950 rounded-md"></div>
                    <div className="w-8 h-8 bg-slate-950 rounded-md"></div>
                  </div>
                  {/* Center Radar / Shield Branding */}
                  <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-8 h-8 bg-slate-950 rounded-md"></div>
                    <span className="text-[9px] font-mono font-bold tracking-tighter text-slate-700">#KAVACH-8924</span>
                  </div>
                </div>
              </div>

              {/* Invite Code Bar */}
              <div className="p-3.5 rounded-2xl bg-[#080d18] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] text-left">Group Invite Code</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{inviteCode}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  leftIcon={copied ? Check : Copy}
                >
                  {copied ? 'Copied Link!' : 'Copy Link'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Connected Group Members */}
        <div className="md:col-span-5 space-y-6">
          <Card variant="elevated">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Group Circle ({currentMembers.length}/6)</CardTitle>
              <Badge variant="primary">LIVE GPS</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {currentMembers.map((mem, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#080d18] border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                      {mem.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{mem.name}</p>
                      <p className="text-[10px] text-slate-400">{mem.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block">{mem.status}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <BatteryMedium className="w-3 h-3 text-emerald-400" />
                      {mem.battery}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Group Safety Broadcast */}
          <Card variant="default" className="p-4 space-y-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              Proximity Safety Geofence
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All 4 companions will be notified instantly if any member strays beyond <strong>150 meters</strong> in high-density Sangam ghats.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
