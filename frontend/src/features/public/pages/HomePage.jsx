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
  Activity, 
  FileCheck2,
} from 'lucide-react';

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
      color: 'bg-[#fff1f2] text-[#e11d48] border-[#ffe4e6]',
      title: 'One-Touch SOS Dispatch',
      description: 'Trigger emergency broadcast in under 3 seconds. Instant alerts to nearest PCR vans and registered family contacts with live GPS coordinates.',
    },
    {
      icon: MapPin,
      color: 'bg-[#f0f9ff] text-[#0ea5e9] border-[#e0f2fe]',
      title: 'Geofenced Safe Havens',
      description: 'Real-time boundary alerts for high-density ghats, deep water zones, and verified medical and police checkpoints across Prayagraj.',
    },
    {
      icon: Users,
      color: 'bg-[#f5f3ff] text-[#8b5cf6] border-[#ede9fe]',
      title: 'Group Tracking & Dynamic QR',
      description: 'Create private family travel circles with zero complexity. Tap to scan dynamic QR codes and keep track of group members in crowded sites.',
    },
    {
      icon: Bot,
      color: 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]',
      title: 'Rakshak AI Safety Companion',
      description: 'Multilingual safety assistant available 24/7. Instant guidance on crowd density, nearest clean water, emergency medicines, and travel routes.',
    },
    {
      icon: FileCheck2,
      color: 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]',
      title: 'Blockchain Tourist Safety ID',
      description: 'Tamper-proof digital identity storing critical medical data (blood group, allergies) and emergency contacts for swift first-responder identification.',
    },
    {
      icon: Activity,
      color: 'bg-[#fdf4ff] text-[#d946ef] border-[#fae8ff]',
      title: 'Live City Risk Heatmap',
      description: 'Real-time risk scoring across Sangam sectors and Kumbh grounds powered by AI crowd sensors and authority dispatch telemetry.',
    },
  ];

  return (
    <div className="space-y-24 py-12 bg-white font-sans min-h-screen">
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#fff1f2] border border-[#ffe4e6] text-[11px] font-bold text-[#e11d48] uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse"></span>
              <span>Prayagraj Smart Tourist Safety Network Active</span>
            </div>

            <h1 className="text-[40px] sm:text-[56px] font-black text-slate-900 tracking-tight leading-[1.1]">
              Explore with Confidence. <br />
              <span className="text-[#e11d48]">
                Protected at Every Step.
              </span>
            </h1>

            <p className="text-[15px] sm:text-[18px] text-slate-600 max-w-xl leading-relaxed font-medium">
              Kavach delivers real-time safety monitoring, instant SOS emergency dispatch, geofenced safe zones, and family group sync for pilgrims and tourists in Prayagraj.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/register">
                <button className="flex items-center gap-2 px-8 py-4 bg-[#e11d48] hover:bg-[#be123c] text-white text-[13px] font-bold uppercase tracking-widest rounded-md shadow-md transition-colors cursor-pointer active:scale-95">
                  Create Safety ID <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/tourist/dashboard">
                <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-[13px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-colors cursor-pointer active:scale-95">
                  <Compass className="w-4 h-4 text-slate-500" /> Explore Live Dashboard
                </button>
              </Link>
            </div>

            {/* Live Protection Stats Bar */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100 text-left">
              <div>
                <p className="text-[28px] font-black text-slate-900 tracking-tight">100K+</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Tourists Protected</p>
              </div>
              <div>
                <p className="text-[28px] font-black text-[#16a34a] tracking-tight">&lt; 2 min</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Avg SOS Response</p>
              </div>
              <div>
                <p className="text-[28px] font-black text-[#0ea5e9] tracking-tight">100%</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Geo-Safe Coverage</p>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Radar Visualizer */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-[420px] aspect-square rounded-lg bg-slate-50 border border-slate-200 p-8 flex flex-col justify-between shadow-xl overflow-hidden">
              {/* Radar Sweep Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-[300px] h-[300px] rounded-full border border-slate-400" />
                <div className="w-[200px] h-[200px] rounded-full border border-slate-400" />
                <div className="w-[100px] h-[100px] rounded-full border border-slate-400" />
                <div className="absolute w-[280px] h-[280px] rounded-full border-t-2 border-r-2 border-[#e11d48] animate-[spin_3s_linear_infinite]" />
              </div>

              {/* Top Badge in Card */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded shadow-sm">
                  PRAYAGRAJ RADAR
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">GPS: 25.4358° N</span>
              </div>

              {/* Interactive Center SOS in Card */}
              <div className="relative z-10 text-center space-y-4 py-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#e11d48] mx-auto z-20 relative">
                    <Radio className="w-10 h-10" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-[#e11d48] animate-ping opacity-20"></div>
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-900 tracking-wide uppercase">Live Emergency Grid</h4>
                  <p className="text-[12px] font-medium text-slate-500 mt-1">Connected to 64 Patrol Units</p>
                </div>
              </div>

              {/* Bottom Quick Trigger */}
              <div className="relative z-10">
                <button className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white py-3.5 rounded-md font-bold text-[12px] uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer">
                  TEST SOS SIMULATION
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRAYAGRAJ GEO-SAFE ZONES LIVE PREVIEW
      ========================================================= */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">VERIFIED SAFE HAVENS</span>
              <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight">
                Nearby Active Safe Zones
              </h2>
              <p className="text-[14px] text-slate-500 max-w-xl mt-2 font-medium">
                Designated assistance booths, medical trauma centers, and tourist police stations equipped with rapid response infrastructure.
              </p>
            </div>
            <Link to="/tourist/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest rounded shadow-sm transition-colors cursor-pointer">
                Open Full Map <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeZones.map((zone, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded border border-[#e0f2fe] bg-[#f0f9ff] text-[#0ea5e9] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest rounded">
                    {zone.distance}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900 leading-tight mb-1">{zone.name}</h4>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{zone.type}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Crowd Level:</span>
                  <span className="text-[#16a34a]">{zone.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CORE FEATURES GRID
      ========================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-bold text-[#e11d48] uppercase tracking-widest block">ARCHITECTURE & CAPABILITIES</span>
          <h2 className="text-[32px] sm:text-[40px] font-black text-slate-900 tracking-tight">
            Engineered for High-Density Safety
          </h2>
          <p className="text-[15px] text-slate-500 font-medium">
            A unified security umbrella combining mobile tracking, AI assistance, and authority integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded flex items-center justify-center border mb-6 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-[16px] font-black text-slate-900 tracking-tight mb-3 uppercase">{feat.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          EMERGENCY HELPLINES BANNER
      ========================================================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-lg bg-slate-900 border border-slate-800 p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-5 text-left">
              <div className="flex items-center gap-2 text-[#fecaca] text-[11px] font-bold uppercase tracking-widest">
                <AlertOctagon className="w-4 h-4 animate-pulse" />
                <span>24/7 Government & Emergency Helplines</span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] font-black text-white tracking-tight leading-tight">
                Immediate Help is Always Within Reach in Prayagraj
              </h2>
              <p className="text-[14px] text-slate-400 max-w-xl leading-relaxed font-medium">
                In any critical situation, you can dial these direct lines or hit the SOS button on this app for automated instant dispatch.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href="tel:112" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#e11d48] hover:bg-[#be123c] text-white text-[12px] font-bold uppercase tracking-widest shadow-md transition-colors">
                  <PhoneCall className="w-4 h-4" />
                  Dial 112 (Police)
                </a>
                <a href="tel:1363" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white hover:bg-slate-100 text-slate-900 text-[12px] font-bold uppercase tracking-widest shadow-md transition-colors">
                  <PhoneCall className="w-4 h-4 text-[#e11d48]" />
                  Dial 1363 (Tourist Police)
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 rounded-lg bg-slate-800 border border-slate-700 text-center space-y-4">
              <ShieldCheck className="w-14 h-14 text-[#34d399]" />
              <div>
                <p className="text-[14px] font-black text-white uppercase tracking-wide">Official UP Police Integration</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Continuous GPS sync with Prayagraj Command</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CALL TO ACTION
      ========================================================= */}
      <section className="max-w-[800px] mx-auto px-4 text-center space-y-8 py-16">
        <h2 className="text-[32px] sm:text-[40px] font-black text-slate-900 tracking-tight">
          Ready to Travel Safely Across Prayagraj?
        </h2>
        <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
          Create your digital Tourist Safety ID in under 60 seconds and gain instant access to live tracking, family sync, and 24/7 SOS assistance.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <button className="flex items-center gap-2 px-8 py-4 bg-[#e11d48] hover:bg-[#be123c] text-white text-[13px] font-bold uppercase tracking-widest rounded-md shadow-md transition-colors cursor-pointer active:scale-95">
              Sign Up Now - It's Free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/login">
            <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-[13px] font-bold uppercase tracking-widest rounded-md shadow-sm transition-colors cursor-pointer active:scale-95">
              Sign In to Existing Account
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
