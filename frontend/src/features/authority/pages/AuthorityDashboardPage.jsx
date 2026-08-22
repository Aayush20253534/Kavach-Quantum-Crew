import React, { useState } from 'react';
import { 
  Building2, 
  Radio, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  BellRing, 
  Send, 
  CheckCircle2, 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';

export function AuthorityDashboardPage() {
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('All Sectors (Sangam + Kumbh + City)');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const activeSOSTickets = [
    {
      id: 'SOS-PRY-8924',
      tourist: 'Prachi Maurya',
      location: 'Sangam Ghat Sector 4',
      coordinates: '25.4358° N, 81.8463° E',
      time: '2 mins ago',
      assignedUnit: 'Patrol PCR #14',
      medicalNote: 'Blood Group O+ · 4 Companions nearby',
      status: 'Active Dispatch',
    },
    {
      id: 'SOS-PRY-8920',
      tourist: 'Amitabh Sen',
      location: 'Allahabad Fort Barrier Gate #2',
      coordinates: '25.4290° N, 81.8760° E',
      time: '14 mins ago',
      assignedUnit: 'Fort Assistance Post #1',
      medicalNote: 'Heat exhaustion assistance requested',
      status: 'Unit On-Site',
    },
  ];

  const sectorTelemetry = [
    { sector: 'Sector 1 (Sangam Confluence)', density: '78% (High)', status: 'warning', patrols: '18 Units' },
    { sector: 'Sector 2 (Akshayavat & Fort)', density: '42% (Normal)', status: 'safe', patrols: '12 Units' },
    { sector: 'Sector 3 (Bade Hanuman Ghat)', density: '65% (Moderate)', status: 'safe', patrols: '14 Units' },
    { sector: 'Sector 4 (Civil Lines Hub)', density: '30% (Low)', status: 'safe', patrols: '8 Units' },
  ];

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastModalOpen(false);
      setBroadcastMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-red-950/70 via-[#0d1526] to-[#111c30] border border-red-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="critical">PRAYAGRAJ POLICE & TOURISM COMMAND</Badge>
            <span className="text-xs text-slate-400 font-mono">SECTOR 1-8 INTEGRATED GRID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Emergency Dispatch & Live Radar
          </h1>
        </div>

        <Button
          variant="danger"
          size="md"
          onClick={() => setBroadcastModalOpen(true)}
          leftIcon={BellRing}
        >
          Broadcast Safety Alert
        </Button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-5 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Active Pilgrims Monitored</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">12,480</p>
          <span className="text-[10px] text-emerald-400 font-bold">+840 in last hour</span>
        </Card>

        <Card variant="elevated" className="p-5 space-y-1 border-red-500/30">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Live SOS Emergencies</span>
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-red-400">2 Active</p>
          <span className="text-[10px] text-red-300 font-medium">Avg Response: 1.8 mins</span>
        </Card>

        <Card variant="elevated" className="p-5 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Active Patrol Units</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">64 PCRs & Boats</p>
          <span className="text-[10px] text-slate-400">100% Radio Signal</span>
        </Card>

        <Card variant="elevated" className="p-5 space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Safe Havens Online</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-sky-400">32 Booths</p>
          <span className="text-[10px] text-slate-400">Paramedics on duty</span>
        </Card>
      </div>

      {/* Main Grid: Active SOS Triage Feed & Sector Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active SOS Triage List */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                <CardTitle className="text-base">Real-Time SOS Incident Triage</CardTitle>
              </div>
              <Badge variant="critical">2 URGENT TICKETS</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {activeSOSTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-2xl bg-[#09101d] border border-red-500/30 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-red-400">{ticket.id}</span>
                      <Badge variant="critical" className="text-[10px]">{ticket.status}</Badge>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {ticket.time}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tourist Name:</span>
                      <span className="font-bold text-white">{ticket.tourist}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">GPS Location:</span>
                      <span className="text-sky-400 font-mono">{ticket.location} ({ticket.coordinates})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Response Unit:</span>
                      <span className="text-emerald-400 font-bold">{ticket.assignedUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Medical Telemetry:</span>
                      <span className="text-slate-300">{ticket.medicalNote}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Connecting radio channel to ${ticket.assignedUnit}`)}
                    >
                      Radio Connect PCR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Marked ${ticket.id} as resolved.`)}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sector Telemetry & Heatmap Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="elevated">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Sector Crowd & Patrol Density</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {sectorTelemetry.map((sec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#080d18] border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{sec.sector}</span>
                    <Badge variant={sec.status} className="text-[9px] py-0">{sec.density}</Badge>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Patrol Deployment:</span>
                    <span className="text-sky-400 font-bold">{sec.patrols}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="BROADCAST MASS SAFETY ADVISORY"
        className="max-w-lg border-red-500/40"
      >
        {!broadcastSent ? (
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <p className="text-xs text-slate-300">
              Transmit urgent push notifications and SMS banners to all registered pilgrims and tourists in the designated sectors.
            </p>

            <Input
              label="Target Sector"
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value)}
            />

            <Textarea
              label="Emergency Advisory Text"
              placeholder="e.g. Due to sudden river current surge, bathing at Sangam Ghat #3 is temporarily redirected to Ghat #4 and #5."
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBroadcastModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                leftIcon={Send}
              >
                Transmit Alert
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Emergency Broadcast Transmitted!</h3>
            <p className="text-xs text-slate-300">Sent to 12,480 active tourists across Prayagraj.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
