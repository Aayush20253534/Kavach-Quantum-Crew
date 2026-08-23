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
    <div className="relative h-full min-h-[600px] w-full overflow-hidden bg-white text-slate-900 select-none">
      {/* ------------------------------------------------
          1. FULLSCREEN DYNAMIC BACKGROUND IMAGES
      ------------------------------------------------ */}
      {prayagrajPlaces.map((place, idx) => (
        <div
          key={place.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeIndex
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-105 pointer-events-none'
            }`}
        >
          <img
            src={place.image}
            alt={place.name}
            className="h-full w-full object-cover object-center"
          />
          {/* Extremely light cinematic gradient overlays to maximize image visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent" />
          <div className="absolute inset-0 bg-white/10" />
        </div>
      ))}

      {/* ------------------------------------------------
          2. TOP BRANDING & LOCATION PILL
      ------------------------------------------------ */}
      <div className="absolute top-8 left-8 right-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 border border-red-200 backdrop-blur-md text-red-600 shadow-sm">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-red-600">
              Quantum-Crew · Kavach
            </p>
            <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              PRAYAGRAJ <span className="text-xs font-medium text-slate-500">TOURISM</span>
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 text-[11px] font-medium text-slate-700 backdrop-blur-md shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-red-500" />
          <span>Uttar Pradesh, India</span>
        </div>
      </div>

      {/* ------------------------------------------------
          3. MAIN HERO CONTENT (LEFT SIDE)
      ------------------------------------------------ */}
      <div className="absolute top-28 bottom-36 left-8 right-8 z-20 flex flex-col justify-end max-w-xl mb-5">
        {/* Destination Category Pill */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
            {currentPlace.tag}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
            {currentPlace.subtitle}
          </span>
        </div>

        {/* Big Bold Destination Title */}
        <h1
          key={currentPlace.name}
          className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight"
        >
          {currentPlace.name}
        </h1>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-700 max-w-lg font-medium">
          {currentPlace.description}
        </p>

        {/* Action Button & Safety Tag */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectPlace && onSelectPlace(currentPlace)}
            className="group flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#e33636] to-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all hover:scale-105 hover:shadow-red-500/40 active:scale-95"
          >
            <span>Explore {currentPlace.name.split(' ')[0]}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
      {/* ------------------------------------------------
          4. FLOATING CAROUSEL CARDS DECK
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
                className={`group relative h-24 sm:h-28 cursor-pointer overflow-hidden rounded-xl border transition-all duration-500 ease-out flex-shrink-0 ${isActive
                  ? 'w-44 sm:w-52 border-red-400 shadow-xl shadow-red-500/20 scale-100 ring-2 ring-red-400/50'
                  : 'w-24 sm:w-28 border-slate-200 opacity-90 hover:opacity-100 hover:w-36 shadow-sm'
                  }`}
              >
                {/* Thumbnail Image */}
                <img
                  src={place.image}
                  alt={place.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Text needs dark gradient to remain readable over image */}
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${isActive
                    ? 'bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent'
                    : 'bg-slate-900/50 group-hover:bg-slate-900/30'
                    }`}
                />

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => toggleBookmark(place.id, e)}
                  aria-label="Bookmark destination"
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md backdrop-blur-md transition-colors ${isBookmarked[place.id]
                    ? 'bg-red-500 text-white'
                    : 'bg-white/40 text-slate-900 hover:bg-white hover:text-red-600'
                    }`}
                >
                  <Bookmark className="h-3 w-3 fill-current" />
                </button>

                {/* Index badge */}
                <div className="absolute top-2 left-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/90 text-[9px] font-black text-red-600 backdrop-blur-md shadow-sm">
                    0{idx + 1}
                  </span>
                </div>

                {/* Title and details on card */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <p className="truncate text-xs font-extrabold text-white group-hover:text-red-200 transition-colors">
                    {place.name}
                  </p>
                  {isActive && (
                    <p className="truncate text-[10px] font-medium text-slate-200">
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-700 backdrop-blur-md transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600 hover:scale-110 active:scale-95 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next destination"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-700 backdrop-blur-md transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600 hover:scale-110 active:scale-95 shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}