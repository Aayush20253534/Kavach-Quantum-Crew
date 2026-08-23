import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Radio,
  Bot,
  ArrowRight,
  Activity,
  FileCheck2,
  Star,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeZones = [
    { name: 'Triveni Sangam Sector 4', type: 'Assistance Booth', distance: '120m', status: 'Active' },
    { name: 'Tej Bahadur Sapru Care', type: 'Medical Center', distance: '1.8 km', status: 'Open' },
    { name: 'Allahabad Fort Post', type: 'Security Checkpoint', distance: '450m', status: 'Active' },
    { name: 'Civil Lines Info', type: 'Helpdesk', distance: '2.5 km', status: 'Open' },
  ];

  const features = [
    {
      icon: Radio,
      title: 'One-Touch SOS',
      description: 'Trigger an emergency alert instantly and share your live location with nearby responders and trusted contacts.',
    },
    {
      icon: MapPin,
      title: 'Geofenced Havens',
      description: 'Discover verified police booths, hospitals, help desks and protected areas around your location.',
    },
    {
      icon: Users,
      title: 'Group Tracking',
      description: 'Create secure travel circles and stay connected with family and friends in high-density locations.',
    },
    {
      icon: Bot,
      title: 'Rakshak AI',
      description: 'Get multilingual guidance for routes, safety alerts, crowd conditions and emergency assistance.',
    },
    {
      icon: FileCheck2,
      title: 'Tourist Safety ID',
      description: 'Access a secure digital identity designed to help first responders assist you more efficiently.',
    },
    {
      icon: Activity,
      title: 'Live Risk Intelligence',
      description: 'Stay aware of changing crowd conditions, emergency activity and important safety information.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-white/20">

      {/* =========================================================
          CINEMATIC HERO SECTION
      ========================================================= */}
      <section className="relative w-full min-h-[100svh] md:min-h-[590px] flex items-start md:items-center pt-[5.25rem] sm:pt-24 pb-4 sm:pb-9 md:pb-10 overflow-hidden bg-[#050505]">

        {/* Background Image Wrapper */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src="/destinations/sangam.jpg"
            alt="Triveni Sangam"
            className="w-full h-full object-cover object-[center_30%] animate-[slow-zoom_20s_ease-out_forwards]"
          />
          {/* Gradients to blend image seamlessly and keep text readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#050505] pointer-events-none" />
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">

          {/* Left Hero Content */}
          <div className="flex-1 max-w-2xl text-left">

            {/* Location Badge */}
            <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] text-white mb-3 sm:mb-5 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </div>
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Prayagraj, Uttar Pradesh</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-[34px] sm:text-[52px] md:text-[64px] lg:text-[74px] leading-[1.02] tracking-[-0.03em] font-black text-white mb-2 sm:mb-3">
              <div className={`overflow-hidden transition-all duration-1000 delay-500 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                EXPLORE
              </div>
              <div className={`overflow-hidden transition-all duration-1000 delay-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <span className="text-white/80">WITHOUT FEAR.</span>
              </div>
            </h1>

            {/* Description */}
            <p className={`text-[12px] sm:text-[16px] leading-[1.55] text-white/70 max-w-lg mb-4 sm:mb-6 font-medium transition-all duration-1000 delay-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              A smarter safety network for pilgrims and tourists exploring Prayagraj. Stay connected, stay aware, and get help when you need it.
            </p>

            {/* CTAs */}
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto transition-all duration-1000 delay-1200 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Link to="/register" className="group w-full sm:w-auto justify-center relative overflow-hidden rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2.5 sm:px-7 sm:py-3.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(225,29,72,0.5)] hover:-translate-y-1 active:scale-95 flex items-center gap-2">
                <span className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_0.8s_ease-in-out]" />
                <span>Create Safety ID</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link to="/tourist/dashboard" className="group w-full sm:w-auto justify-center flex items-center gap-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-5 py-2.5 sm:px-7 sm:py-3.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1 active:scale-95">
                <span>View Live Map</span>
              </Link>
            </div>

            <div className={`mt-3.5 sm:mt-5 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-[0.12em] text-white/55 transition-all duration-1000 delay-[1350ms] transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified help points</span>
              <span className="inline-flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-sky-400" /> Live safety radar</span>
              <span className="inline-flex items-center gap-1.5 col-span-2 sm:col-span-1"><Clock className="h-3.5 w-3.5 text-amber-400" /> 24/7 emergency access</span>
            </div>
          </div>

          {/* Right Floating Glass Card (Exact inspiration matching) */}
          <div className={`hidden lg:block w-[360px] transition-all duration-1000 delay-1500 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden relative group hover:bg-black/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  Top Destination
                </div>
              </div>

              <h3 className="text-[24px] font-black text-white tracking-tight uppercase mb-2">Triveni Sangam</h3>
              <p className="text-[12px] text-white/60 leading-relaxed font-medium mb-4">
                The sacred confluence of Ganga, Yamuna & Saraswati. Experience spirituality like never before.
              </p>

              <div className="flex items-center gap-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-white/60" />
                  <div>
                    <p className="text-[14px] font-black leading-none">3.2 KM</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">Distance</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-white/60" />
                  <div>
                    <p className="text-[14px] font-black leading-none">4.8</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          SAFE ZONES SECTION (Premium & Clean)
      ========================================================= */}
      <section id="safe-zones" className="bg-[#050505] pt-8 pb-8 sm:py-10 md:py-12 border-t border-white/5 relative z-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6 md:mb-7 gap-3.5 md:gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
                <div className="h-px w-12 bg-rose-500/50" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400">Verified Network</span>
              </div>
              <h2 className="text-[26px] sm:text-[34px] md:text-[40px] font-black tracking-tight leading-tight">
                Help is always <br className="hidden sm:block" />
                <span className="text-white/40">closer than you think.</span>
              </h2>
            </div>
            <Link to="/tourist/dashboard" className="group inline-flex justify-center w-full sm:w-auto items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 sm:py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10">
              Explore Live Map <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
            {safeZones.map((zone, idx) => (
              <div key={idx} className="group rounded-[1.25rem] border border-white/5 bg-[#0a0a0a] p-4 sm:p-5 transition-all duration-300 hover:border-white/15 hover:bg-[#0f0f0f] hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/5 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-colors">
                    <Navigation className="h-4 w-4 text-white/60 group-hover:text-rose-400 transition-colors" />
                  </div>
                  <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {zone.distance}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold tracking-tight mb-2">{zone.name}</h3>
                <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide">{zone.type}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
          FEATURES BENTO GRID
      ========================================================= */}
      <section id="features" className="bg-[#050505] py-9 sm:py-11 md:py-14 border-t border-white/5 relative z-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

          <div className="max-w-3xl mx-auto text-center mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
              <div className="h-px w-12 bg-white/20" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Core Capabilities</span>
              <div className="h-px w-12 bg-white/20" />
            </div>
            <h2 className="text-[26px] sm:text-[34px] md:text-[40px] font-black tracking-tight leading-tight">
              A unified safety layer <br />
              <span className="text-white/40">for every journey.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              // Make the first and fourth cards span larger in a bento style if on large screens
              const isLarge = idx === 0 || idx === 3;

              return (
                <div key={idx} className={`group rounded-[1.5rem] border border-white/5 bg-[#0a0a0a] p-5 sm:p-6 transition-all duration-300 hover:border-white/10 hover:bg-[#0c0c0c] flex flex-col justify-between ${isLarge ? 'md:col-span-2 lg:col-span-2' : ''}`}>
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/5 mb-4 group-hover:scale-110 transition-transform duration-500">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <h3 className="text-[18px] font-bold tracking-tight mb-2.5">{feat.title}</h3>
                    <p className="text-[13px] leading-relaxed text-white/50 font-medium">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="relative py-10 sm:py-12 md:py-16 border-t border-white/5 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
          <h2 className="text-[30px] sm:text-[42px] md:text-[52px] font-black tracking-tight mb-3 md:mb-4">
            Ready to explore?
          </h2>
          <p className="text-[13px] sm:text-[16px] text-white/50 font-medium leading-relaxed max-w-2xl mx-auto mb-5 md:mb-6">
            Create your digital Tourist Safety ID in under 60 seconds and gain instant access to live tracking, family sync, and 24/7 assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 w-full">
            <Link to="/register" className="group w-full sm:w-auto justify-center relative overflow-hidden rounded-full bg-white px-6 py-3.5 sm:px-8 sm:py-4 text-[12px] font-bold uppercase tracking-[0.1em] text-black transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <span>Create Safety ID</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}} />
    </div>
  );
}