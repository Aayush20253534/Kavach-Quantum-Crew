import React from 'react';
import { Star, BedDouble, ExternalLink } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export function HotelRecommendations({ hotels }) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="space-y-3">
      {hotels.map((hotel, idx) => {
        let tierLabel = '';
        let tierColor = '';
        
        if (idx === 0) {
          tierLabel = 'Budget Pick';
          tierColor = 'bg-emerald-100 text-emerald-700';
        } else if (idx === hotels.length - 1 && hotels.length > 2) {
          tierLabel = 'Premium';
          tierColor = 'bg-amber-100 text-amber-700';
        } else {
          tierLabel = 'Mid-Range';
          tierColor = 'bg-blue-100 text-blue-700';
        }

        return (
          <div key={idx} className="group flex flex-row bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="w-24 sm:w-28 bg-slate-100 relative overflow-hidden shrink-0">
              {hotel.thumbnail ? (
                <img 
                  src={hotel.thumbnail} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <BedDouble className="w-10 h-10" />
                </div>
              )}
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md backdrop-blur-md bg-white/90 ${tierColor.replace('bg-', 'text-').replace('-100', '-700')}`}>
                  {tierLabel}
                </span>
              </div>
              
              {hotel.rating && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold">{hotel.rating}</span>
                </div>
              )}
            </div>
            
            <div className="p-3 flex min-w-0 flex-col flex-1">
              <h4 className="text-sm font-black text-slate-900 mb-1 leading-tight line-clamp-1">{hotel.name}</h4>
              {hotel.hotel_class && (
                <p className="text-xs font-semibold text-slate-500 mb-2">{hotel.hotel_class} Hotel</p>
              )}
              
              <div className="mt-auto flex items-end justify-between pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Per Night</p>
                  <p className="text-sm font-black text-slate-900 leading-none">{formatPrice(hotel.price)}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors" title="View details">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
