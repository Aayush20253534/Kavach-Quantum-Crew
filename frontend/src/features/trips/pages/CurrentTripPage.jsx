import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Users, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  QrCode, 
  BatteryMedium, 
  Radio, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { SOSButton } from '../../../components/ui/SOSButton';

export function CurrentTripPage() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'itinerary' | 'group'

  const milestones = [
    { title: 'Triveni Sangam Holy Dip', time: '09:45 AM', status: 'Completed', location: 'Sangam Ghat 4' },
    { title: 'Akshayavat & Patalpuri Temple', time: '11:30 AM', status: 'In Progress', location: 'Allahabad Fort' },
    { title: 'Bade Hanuman Ji Darshan', time: '01:00 PM', status: 'Upcoming', location: 'Bandhwa Hanuman Mandir' },
    { title: 'Anand Bhavan Museum Tour', time: '03:30 PM', status: 'Upcoming', location: 'Civil Lines' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-sky-950/70 via-[#0d1526] to-[#111c30] border border-sky-500/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="safe">LIVE TRIP IN PROGRESS</Badge>
            <span className="text-xs text-slate-400 font-mono">Trip ID: #TRP-PRY-1094</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Prayagraj Sangam & Heritage Circuit
          </h1>
          <p className="text-xs text-slate-300">
            Started Today at 09:30 AM · Current Zone: <strong>Allahabad Fort Sector (Safe)</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SOSButton size="md" />
          <Link to="/tourist/incidents/report">
            <Button variant="secondary" size="md" leftIcon={AlertTriangle}>
              Report Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Map & Itinerary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Map Radar */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-base">Active Geofence Radar View</CardTitle>
              </div>
              <Badge variant="safe">ACCURACY: HIGH</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 w-full bg-[#070d18] relative flex items-center justify-center border-y border-slate-800 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-[300px] h-[300px] rounded-full border border-sky-500/20" />
                  <div className="w-[180px] h-[180px] rounded-full border border-sky-500/30" />
                </div>

                <div className="w-64 h-52 rounded-3xl border-2 border-dashed border-emerald-400/40 bg-emerald-500/5 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase">
                    Fort Sector Safe Perimeter
                  </span>
                </div>

                {/* You Pin */}
                <div className="absolute flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-sky-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-[9px] font-black animate-pulse">
                    YOU
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white border border-sky-500/40 font-bold">
                    Akshayavat Tree Point
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#09101d] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">Nearest Police Assistance: <strong>80m (Fort Gate Booth)</strong></span>
                <span className="text-emerald-400 font-semibold">100% Group Members Inside Boundary</span>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary Milestones */}
          <Card variant="elevated">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Trip Milestones & Checkpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#080d18] border border-slate-800/80">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{m.title}</h4>
                      <Badge
                        variant={m.status === 'Completed' ? 'safe' : m.status === 'In Progress' ? 'primary' : 'neutral'}
                        className="text-[9px] py-0"
                      >
                        {m.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.location} · Expected {m.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 4 Cols: Group & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="elevated">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Group Sync (4 Members)</CardTitle>
              <Link to="/tourist/groups/create">
                <Button variant="ghost" size="sm" className="text-xs text-sky-400 p-0 hover:bg-transparent">
                  + Invite
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { name: 'Prachi Maurya (Leader)', battery: '88%', dist: '0m' },
                { name: 'Aayansh Sharma', battery: '74%', dist: '12m' },
                { name: 'Kavita Verma', battery: '92%', dist: '45m' },
                { name: 'Rohan Gupta', battery: '40%', dist: '120m' },
              ].map((mem, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#080d18] border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-100">{mem.name}</p>
                    <p className="text-[10px] text-slate-400">Distance: {mem.dist}</p>
                  </div>
                  <Badge variant="safe" className="text-[9px] py-0">Online</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="default" className="p-5 text-center space-y-3">
            <p className="text-xs text-slate-300">Need to conclude your pilgrimage trip?</p>
            <Link to="/tourist/trips/history" className="block">
              <Button variant="secondary" size="md" className="w-full text-xs">
                Finish Trip & Log Safety Summary
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
