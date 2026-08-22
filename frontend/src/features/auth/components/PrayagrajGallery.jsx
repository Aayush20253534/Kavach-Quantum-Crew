import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  ShieldCheck,
  Compass,
} from 'lucide-react';

/**
 * ----------------------------------------------------------------------
 * 📸 PRAYAGRAJ TOURIST DESTINATIONS LIST (Customize with your own images)
 * ----------------------------------------------------------------------
 * You can put your own images into:
 *   frontend/public/images/prayagraj/
 * and reference them like:
 *   image: '/images/prayagraj/my-sangam.jpg'
 *
 * Currently using high-resolution fallback photography:
 * ----------------------------------------------------------------------
 */
export const prayagrajPlaces = [
  {
    id: 1,
    name: 'Triveni Sangam',
    subtitle: 'The Sacred Confluence',
    tag: 'Spiritual Center',
    safetyStatus: 'High Security Zone',
    description:
      'Where the holy Ganga, Yamuna, and mystical Saraswati meet — the spiritual heartbeat of Prayagraj with 24/7 smart crowd and safety monitoring.',
    image:
      'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 2,
    name: 'Prayagraj Fort',
    subtitle: 'Akbar’s Mughal Marvel',
    tag: 'Historical Heritage',
    safetyStatus: 'Monitored Perimeter',
    description:
      'A majestic 16th-century fortress overlooking the Yamuna riverfront, guarding centuries of history, ornate architecture, and the legendary Akshayavat.',
    image:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 3,
    name: 'Khusro Bagh',
    subtitle: 'Mughal Architecture & Serenity',
    tag: 'Garden & Tombs',
    safetyStatus: 'Verified Safe Area',
    description:
      'A peaceful quadrilateral walled garden featuring grand sandstone mausoleums, Mughal symmetry, and the historic burial site of Prince Khusro.',
    image:
      'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 4,
    name: 'Anand Bhavan',
    subtitle: 'Cradle of Freedom',
    tag: 'National Memorial',
    safetyStatus: 'Tourist Protected Zone',
    description:
      'The historic ancestral home of the Nehru family turned national museum, preserving India’s freedom struggle memorabilia amidst scenic grounds.',
    image:
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=90',
  },
];

export default function PrayagrajGallery({ onSelectPlace }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState({});

  const currentPlace = prayagrajPlaces[activeIndex];

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % prayagrajPlaces.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % prayagrajPlaces.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? prayagrajPlaces.length - 1 : prev - 1
    );
  };

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setIsBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative h-full min-h-[600px] w-full overflow-hidden bg-slate-950 text-white select-none">
      {/* ------------------------------------------------
          1. FULLSCREEN DYNAMIC BACKGROUND IMAGES
      ------------------------------------------------ */}
      {prayagrajPlaces.map((place, idx) => (
        <div
          key={place.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            idx === activeIndex
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          <img
            src={place.image}
            alt={place.name}
            className="h-full w-full object-cover object-center"
          />
          {/* Subtle cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      ))}

      {/* ------------------------------------------------
          2. TOP BRANDING & LOCATION PILL
      ------------------------------------------------ */}
      <div className="absolute top-8 left-8 right-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-400/30 backdrop-blur-md text-sky-400 shadow-lg shadow-sky-500/10">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-sky-400">
              Quantum-Crew · Kavach
            </p>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              PRAYAGRAJ <span className="text-xs font-medium text-slate-400">TOURISM</span>
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 text-sky-400" />
          <span>Uttar Pradesh, India</span>
        </div>
      </div>

      {/* ------------------------------------------------
          3. MAIN HERO CONTENT (LEFT SIDE)
      ------------------------------------------------ */}
      <div className="absolute top-28 bottom-36 left-8 right-8 z-20 flex flex-col justify-end max-w-xl">
        {/* Destination Category Pill */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            {currentPlace.tag}
          </span>
          <span className="text-xs font-semibold text-slate-300/80 uppercase tracking-widest">
            {currentPlace.subtitle}
          </span>
        </div>

        {/* Big Bold Destination Title (as in Pinterest reference) */}
        <h1
          key={currentPlace.name}
          className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-lg"
        >
          {currentPlace.name}
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-200/90 max-w-lg drop-shadow">
          {currentPlace.description}
        </p>

        {/* Action Button & Safety Tag */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onSelectPlace && onSelectPlace(currentPlace)}
            className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:scale-105 hover:shadow-sky-500/50 active:scale-95"
          >
            <span>Explore {currentPlace.name.split(' ')[0]}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{currentPlace.safetyStatus}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------
          4. FLOATING CAROUSEL CARDS DECK (PINTEREST STYLE)
      ------------------------------------------------ */}
      <div className="absolute bottom-6 left-8 right-8 z-30 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        {/* Destination Preview Cards Deck */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {prayagrajPlaces.map((place, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={place.id}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`group relative h-24 sm:h-28 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-500 ease-out flex-shrink-0 ${
                  isActive
                    ? 'w-44 sm:w-52 border-sky-400 shadow-xl shadow-sky-500/20 scale-100 ring-2 ring-sky-400/50'
                    : 'w-24 sm:w-28 border-white/20 opacity-70 hover:opacity-100 hover:w-36'
                }`}
              >
                {/* Thumbnail Image */}
                <img
                  src={place.image}
                  alt={place.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Dark Vignette */}
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${
                    isActive
                      ? 'bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent'
                      : 'bg-slate-950/60 group-hover:bg-slate-950/30'
                  }`}
                />

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => toggleBookmark(place.id, e)}
                  aria-label="Bookmark destination"
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                    isBookmarked[place.id]
                      ? 'bg-sky-500 text-white'
                      : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white'
                  }`}
                >
                  <Bookmark className="h-3 w-3 fill-current" />
                </button>

                {/* Index badge */}
                <div className="absolute top-2 left-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/70 text-[9px] font-black text-sky-400 backdrop-blur-md">
                    0{idx + 1}
                  </span>
                </div>

                {/* Title and details on card */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <p className="truncate text-xs font-extrabold text-white group-hover:text-sky-300 transition-colors">
                    {place.name}
                  </p>
                  {isActive && (
                    <p className="truncate text-[10px] font-medium text-slate-300">
                      {place.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center gap-2 self-end">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous destination"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 text-white backdrop-blur-md transition-all hover:bg-sky-500 hover:border-sky-400 hover:scale-110 active:scale-95 shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next destination"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 text-white backdrop-blur-md transition-all hover:bg-sky-500 hover:border-sky-400 hover:scale-110 active:scale-95 shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}