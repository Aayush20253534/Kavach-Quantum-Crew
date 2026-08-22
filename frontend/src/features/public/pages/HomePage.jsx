import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertOctagon, 
  MapPin, 
  Users, 
  Radio, 
  Bot, 
  Compass, 
  PhoneCall, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  QrCode, 
  FileCheck2,
  Lock,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { SOSButton } from '../../../components/ui/SOSButton';

export function HomePage() {
  const safeZones = [
    { name: 'Triveni Sangam Sector 4 Hub', type: 'Assistance & Police Booth', distance: '120m', status: 'Safe', capacity: 'Normal Flow' },
    { name: 'Tej Bahadur Sapru Trauma Care', type: '24/7 Hospital & Medical', distance: '1.8 km', status: 'Safe', capacity: 'Open' },
    { name: 'Allahabad Fort Security Post', type: 'Armed Security & CCTV', distance: '450m', status: 'Safe', capacity: 'Active' },
    { name: 'Civil Lines Tourist Information', type: 'Multilingual Helpdesk', distance: '2.5 km', status: 'Safe', capacity: 'Open' },
  ];

  const features = [
    {
      icon: Radio,
      color: 'from-red-500 to-rose-600',
      title: 'One-Touch SOS Dispatch',
      description: 'Trigger emergency broadcast in under 3 seconds. Instant alerts to nearest PCR vans and registered family contacts with live GPS coordinates.',
    },
    {
      icon: MapPin,
      color: 'from-sky-500 to-blue-600',
      title: 'Geofenced Safe Havens',
      description: 'Real-time boundary alerts for high-density ghats, deep water zones, and verified medical and police checkpoints across Prayagraj.',
    },
    {
      icon: Users,
      color: 'from-indigo-500 to-violet-600',
      title: 'Group Tracking & Dynamic QR',
      description: 'Create private family travel circles with zero complexity. Tap to scan dynamic QR codes and keep track of group members in crowded pilgrimage sites.',
    },
    {
      icon: Bot,
      color: 'from-emerald-500 to-teal-600',
      title: 'Rakshak AI Safety Companion',
      description: 'Multilingual safety assistant available 24/7. Instant guidance on crowd density, nearest clean water, emergency medicines, and travel routes.',
    },
    {
      icon: FileCheck2,
      color: 'from-amber-500 to-yellow-600',
      title: 'Blockchain Tourist Safety ID',
      description: 'Tamper-proof digital identity storing critical medical data (blood group, allergies) and emergency contacts for swift first-responder identification.',
    },
    {
      icon: Activity,
      color: 'from-purple-500 to-pink-600',
      title: 'Live City Risk Heatmap',
      description: 'Real-time risk scoring across Sangam sectors and Kumbh grounds powered by AI crowd sensors and authority dispatch telemetry.',
    },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Radar concentric glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111c30] border border-sky-500/30 text-xs font-semibold text-sky-400 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Prayagraj Smart Tourist Safety Network Active</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Explore with Confidence. <br />
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Protected at Every Step.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Kavach delivers real-time safety monitoring, instant SOS emergency dispatch, geofenced safe zones, and family group sync for pilgrims and tourists in Prayagraj.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/register">
                  <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                    Create Your Safety ID
                  </Button>
                </Link>
                <Link to="/tourist/dashboard">
                  <Button variant="secondary" size="lg" leftIcon={Compass}>
                    Explore Live Dashboard
                  </Button>
                </Link>
              </div>

              {/* Live Protection Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">100K+</p>
                  <p className="text-xs text-slate-400 font-medium">Tourists Protected</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">&lt; 2 min</p>
                  <p className="text-xs text-slate-400 font-medium">Avg SOS Response</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">100%</p>
                  <p className="text-xs text-slate-400 font-medium">Geo-Safe Coverage</p>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Radar Visualizer */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-[380px] aspect-square rounded-3xl bg-[#0d1526] border border-sky-500/30 p-6 flex flex-col justify-between shadow-2xl shadow-sky-500/10 overflow-hidden">
                {/* Radar Sweep Effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[300px] h-[300px] rounded-full border border-sky-500/20" />
                  <div className="w-[200px] h-[200px] rounded-full border border-sky-500/30" />
                  <div className="w-[100px] h-[100px] rounded-full border border-sky-500/40" />
                  <div className="absolute w-[280px] h-[280px] rounded-full border-t-2 border-r-2 border-sky-400/60 animate-radar" />
                </div>

                {/* Top Badge in Card */}
                <div className="relative z-10 flex items-center justify-between">
                  <Badge variant="safe">PRAYAGRAJ RADAR</Badge>
                  <span className="text-[11px] font-mono text-slate-400">GPS: 25.4358° N</span>
                </div>

                {/* Interactive Center SOS in Card */}
                <div className="relative z-10 text-center space-y-3 py-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto animate-pulse">
                      <Radio className="w-10 h-10" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Emergency Grid</h4>
                    <p className="text-[11px] text-slate-400">Connected to 64 Patrol Units</p>
                  </div>
                </div>

                {/* Bottom Quick Trigger */}
                <div className="relative z-10">
                  <SOSButton size="md" className="w-full justify-center" label="TEST SOS SIMULATION" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRAYAGRAJ GEO-SAFE ZONES LIVE PREVIEW
      ========================================================= */}
      <section id="safe-zones" className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-left">
          <div>
            <Badge variant="primary" className="mb-2">VERIFIED SAFE HAVENS</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Nearby Active Safe Zones in Prayagraj
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
              Designated assistance booths, medical trauma centers, and tourist police stations equipped with rapid response infrastructure.
            </p>
          </div>
          <Link to="/tourist/dashboard">
            <Button variant="outline" size="sm" rightIcon={ArrowRight}>
              Open Full Map View
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {safeZones.map((zone, idx) => (
            <Card key={idx} variant="elevated" className="hover:border-sky-500/40 transition group text-left">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <Badge variant="safe" className="text-[10px]">{zone.distance}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                    {zone.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{zone.type}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Crowd Level:</span>
                  <span className="text-emerald-400 font-semibold">{zone.capacity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================
          CORE FEATURES GRID
      ========================================================= */}
      <section id="features" className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <Badge variant="primary">ARCHITECTURE & CAPABILITIES</Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Engineered for High-Density Tourist Safety
          </h2>
          <p className="text-sm text-slate-400">
            A unified security umbrella combining mobile tracking, AI assistance, and authority integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} variant="default" className="hover:border-sky-500/30 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          EMERGENCY HELPLINES BANNER
      ========================================================= */}
      <section id="helplines" className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-red-950/40 via-[#0d1526] to-sky-950/40 border border-red-500/30 p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 animate-pulse" />
                <span>24/7 Government & Emergency Helplines</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Immediate Help is Always Within Reach in Prayagraj
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                In any critical situation, you can dial these direct lines or hit the SOS button on this app for automated instant dispatch.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="tel:112" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition">
                  <PhoneCall className="w-4 h-4" />
                  Dial 112 (Police)
                </a>
                <a href="tel:1363" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition">
                  <PhoneCall className="w-4 h-4" />
                  Dial 1363 (Tourist Police)
                </a>
                <a href="tel:1090" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#152238] border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800 transition">
                  <PhoneCall className="w-4 h-4" />
                  Dial 1090 (Women Safety)
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#080d18] border border-slate-800 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-white">Official UP Police Integration</p>
                <p className="text-xs text-slate-400 mt-0.5">Continuous GPS sync with Prayagraj Command</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CALL TO ACTION
      ========================================================= */}
      <section className="container mx-auto max-w-4xl px-4 text-center space-y-6 pb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Ready to Travel Safely Across Prayagraj?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Create your digital Tourist Safety ID in under 60 seconds and gain instant access to live tracking, family sync, and 24/7 SOS assistance.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <Button variant="primary" size="lg" rightIcon={ArrowRight}>
              Sign Up Now - It's Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In to Existing Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
