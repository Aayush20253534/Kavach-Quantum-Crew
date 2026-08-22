import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ShieldCheck, 
  MapPin, 
  Users, 
  Compass, 
  AlertTriangle, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Navigation, 
  Activity, 
  PhoneCall, 
  Clock, 
  BatteryMedium, 
  Sparkles,
  QrCode,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { SOSButton } from '../../../components/ui/SOSButton';

export function TouristDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  // Support toggling between State A (No Active Trip) and State B (Active Trip)
  const [hasActiveTrip, setHasActiveTrip] = useState(true);

  const activeTripData = {
    destination: 'Triveni Sangam & Akbar Fort Circuit',
    startedAt: '09:30 AM Today',
    riskLevel: 'LOW',
    currentZone: 'Sangam Sector 4 (Ghat Area)',
    gps: '25.4358° N, 81.8463° E',
    activeMembers: [
      { name: 'Prachi Maurya (You)', role: 'Leader', battery: '88%', distance: 'Here', status: 'Online' },
      { name: 'Aayansh Sharma', role: 'Member', battery: '74%', distance: '12m away', status: 'Online' },
      { name: 'Kavita Verma', role: 'Member', battery: '92%', distance: '45m away', status: 'Online' },
      { name: 'Rohan Gupta', role: 'Member', battery: '40%', distance: '120m away', status: 'In Geo-fence' },
    ],
    nearestSafeHavens: [
      { name: 'Sangam Sector 4 Police Post', type: 'Police & First Aid', distance: '110m', time: '1 min walk' },
      { name: 'SDRF River Rescue Station #2', type: 'Water Rescue', distance: '180m', time: '2 min walk' },
      { name: 'Tej Bahadur Sapru Trauma Unit', type: '24/7 Hospital', distance: '1.8 km', time: '6 min drive' },
    ],
  };

  const safeZonesList = [
    { name: 'Triveni Sangam Ghats (Sector 1-4)', type: 'Pilgrim Hub', distance: '300m', risk: 'safe', density: 'Moderate' },
    { name: 'Anand Bhavan Assistance Booth', type: 'Tourist Desk', distance: '2.1 km', risk: 'safe', density: 'Low' },
    { name: 'Civil Lines Central PCR Station', type: 'Police Station', distance: '3.4 km', risk: 'safe', density: 'Normal' },
    { name: 'Allahabad Fort Outer Barrier', type: 'Security Zone', distance: '650m', risk: 'safe', density: 'Low' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* State Switcher Tool Bar (For Interactive UI Demonstration) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0d1526] border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Dashboard View Simulator:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHasActiveTrip(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !hasActiveTrip
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-[#152238] text-slate-400 hover:text-white'
            }`}
          >
            State A: No Active Trip
          </button>
          <button
            onClick={() => setHasActiveTrip(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              hasActiveTrip
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-[#152238] text-slate-400 hover:text-white'
            }`}
          >
            State B: Active Trip Live
          </button>
        </div>
      </div>

      {/* =========================================================
          STATE B: ACTIVE TRIP LIVE COCKPIT
      ========================================================= */}
      {hasActiveTrip ? (
        <div className="space-y-6">
          {/* Active Trip Banner Hero */}
          <div className="relative rounded-3xl bg-gradient-to-r from-sky-950/70 via-[#0d1526] to-[#111c30] border border-sky-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="safe">TRIP ACTIVE · 4 COMPANIONS</Badge>
                  <Badge variant="primary">SECTOR 4 RADAR SYNCED</Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeTripData.destination}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Started: {activeTripData.startedAt}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {activeTripData.currentZone}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    ({activeTripData.gps})
                  </span>
                </div>
              </div>

              {/* Quick Actions in Banner */}
              <div className="flex flex-wrap items-center gap-3">
                <SOSButton size="md" />
                <Link to="/tourist/incidents/report">
                  <Button variant="secondary" size="md" leftIcon={AlertTriangle}>
                    Report Issue
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Grid Layout: Live Map Simulation & Group Companions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Interactive Map Simulation Card */}
            <div className="lg:col-span-8 space-y-6">
              <Card variant="elevated" className="overflow-hidden border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-sky-400" />
                    <CardTitle className="text-base">Live Geo-Fence & Radar View</CardTitle>
                  </div>
                  <Badge variant="safe">GPS ACCURACY ±3M</Badge>
                </CardHeader>
                <CardContent className="p-0 relative">
                  {/* Simulated Map Visualizer */}
                  <div className="h-72 sm:h-80 w-full bg-[#070d18] relative flex items-center justify-center overflow-hidden border-y border-slate-800">
                    {/* Concentric grid lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[320px] h-[320px] rounded-full border border-sky-500/10" />
                      <div className="w-[200px] h-[200px] rounded-full border border-sky-500/20" />
                      <div className="w-[80px] h-[80px] rounded-full border border-sky-500/30" />
                    </div>

                    {/* Geofence polygon boundary mockup */}
                    <div className="absolute w-56 h-48 rounded-3xl border-2 border-dashed border-emerald-400/40 bg-emerald-500/5 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                        Designated Sangam Safe Zone
                      </span>
                    </div>

                    {/* Active User Pin */}
                    <div className="absolute flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-lg shadow-sky-500/60 animate-ping absolute" />
                      <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-black z-10">
                        YOU
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white border border-sky-500/40">
                        Prachi (Current Position)
                      </span>
                    </div>

                    {/* Companion Pins */}
                    <div className="absolute top-16 left-24 flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Aayansh (12m)</span>
                    </div>
                    <div className="absolute bottom-16 right-24 flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Kavita (45m)</span>
                    </div>
                  </div>

                  {/* Nearest Safe Havens Rapid Navigation Footer */}
                  <div className="p-4 bg-[#09101d] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {activeTripData.nearestSafeHavens.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#0d1526] border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-slate-200 font-bold">
                          <span className="truncate">{h.name}</span>
                          <span className="text-sky-400 font-mono">{h.distance}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{h.type} · {h.time}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Group Companion Live Status Grid */}
              <Card variant="elevated" className="border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <CardTitle className="text-base">Travel Group Companions (4/4 Safe)</CardTitle>
                  </div>
                  <Link to="/tourist/groups/create">
                    <Button variant="outline" size="sm" leftIcon={QrCode}>
                      Group Invite QR
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeTripData.activeMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#080d18] border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.role} · {member.distance}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="safe" className="text-[10px] py-0">{member.status}</Badge>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <BatteryMedium className="w-3 h-3 text-emerald-400" />
                          {member.battery}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Live Safety Advisory & Tools */}
            <div className="lg:col-span-4 space-y-6">
              {/* Trip Risk Level Gauge */}
              <Card variant="elevated" className="border-slate-800">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm">Current Sector Safety Index</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-4 border-emerald-400/50 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/10">
                    <span className="text-2xl font-black text-emerald-400">98</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">SAFETY SCORE</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Normal Pilgrimage Flow</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Sangam ghat barricades are verified. River currents are normal. 18 SDRF boats on active duty.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080d18] border border-slate-800/80 text-left text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>Crowd Density:</span>
                      <span className="text-emerald-400 font-bold">42% (Optimal)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Weather Alert:</span>
                      <span className="text-slate-300">Clear · 28°C</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Nearest First Aid:</span>
                      <span className="text-sky-400 font-bold">110m (Booth #4)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* End Trip / Switch Action */}
              <Card variant="default" className="border-slate-800 text-center p-5 space-y-3">
                <p className="text-xs text-slate-400">Arrived at your destination safely?</p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setHasActiveTrip(false)}
                  className="w-full text-xs"
                >
                  Conclude Current Trip & Log History
                </Button>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================
            STATE A: NO ACTIVE TRIP (WELCOME & PLANNING STATE)
        ========================================================= */
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#0d1526] via-[#111c30] to-sky-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="safe">RADAR IDLE · READY FOR TRAVEL</Badge>
                  <span className="text-xs text-slate-400">Prayagraj, UP</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Prachi'}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                  You do not have an ongoing trip right now. Plan a new journey to enable real-time geofence tracking, family sync, and automatic safety alerts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/tourist/trips/create">
                  <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                    Plan New Trip
                  </Button>
                </Link>
                <Link to="/tourist/groups/join">
                  <Button variant="secondary" size="lg" leftIcon={QrCode}>
                    Join via QR
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/tourist/trips/create" className="group">
              <Card variant="elevated" className="hover:border-sky-500/40 transition p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                    Plan Solo / Group Trip
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Select Prayagraj destinations & setup check-in intervals.</p>
                </div>
              </Card>
            </Link>

            <Link to="/tourist/groups/create" className="group">
              <Card variant="elevated" className="hover:border-indigo-500/40 transition p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    Create Family Circle
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Generate dynamic QR codes for family & companion sync.</p>
                </div>
              </Card>
            </Link>

            <Link to="/tourist/incidents/report" className="group">
              <Card variant="elevated" className="hover:border-amber-500/40 transition p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    Report Safety Concern
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Instant report to Tourist Police for scams, crowd surges, etc.</p>
                </div>
              </Card>
            </Link>

            <Link to="/tourist/profile" className="group">
              <Card variant="elevated" className="hover:border-emerald-500/40 transition p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Digital Safety ID Card
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">View your blockchain emergency badge and medical card.</p>
                </div>
              </Card>
            </Link>
          </div>

          {/* Nearby Safe Havens Explorer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Safe Havens in Your Proximity</h3>
              <Badge variant="safe">4 Active Checkpoints</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {safeZonesList.map((zone, i) => (
                <Card key={i} variant="elevated" className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono text-sky-400 font-bold">{zone.distance}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{zone.name}</h4>
                    <p className="text-[11px] text-slate-400">{zone.type}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                    <span className="text-slate-400">Density:</span>
                    <span className="text-emerald-400 font-semibold">{zone.density}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
