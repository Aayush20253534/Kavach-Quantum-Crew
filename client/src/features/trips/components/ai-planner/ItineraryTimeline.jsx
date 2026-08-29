import React from 'react';
import { Clock, MapPin, ExternalLink, GripVertical, Trash2 } from 'lucide-react';

const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

export function ItineraryTimeline({ days }) {
  if (!days || days.length === 0) return null;

  return (
    <div className="space-y-6">
      {days.map((dayPlan) => (
        <div key={dayPlan.day} className="relative">
          {/* Day Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest">
              Day {dayPlan.day}
            </div>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {(!dayPlan.places || dayPlan.places.length === 0) ? (
              <div className="relative flex items-center gap-3 group pl-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow-sm shrink-0 z-10">
                  <Clock className="w-3 h-3" />
                </div>
                <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 italic text-sm font-medium">
                  Free Day — No specific activities planned.
                </div>
              </div>
            ) : (
              dayPlan.places.map((place, idx) => (
                <div key={idx} className="relative flex items-start gap-3 group pl-1">
                  {/* Timeline Node */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border-4 border-white bg-slate-900 text-white shadow-sm shrink-0 z-10 mt-1">
                    <MapPin className="w-3 h-3" />
                  </div>
                  
                  {/* Activity Card */}
                  <div className="flex-1 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group/card relative">
                    
                    {/* Action buttons (visible on hover) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors" title="Move activity">
                        <GripVertical className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Remove activity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {place.thumbnail && (
                        <div className="w-full sm:w-20 h-32 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img 
                            src={place.thumbnail} 
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 pr-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTime(place.start_time)} - {formatTime(place.end_time)}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-2 leading-snug">{place.name}</h4>
                        
                        {place.url && (
                          <a 
                            href={place.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors mt-2"
                          >
                            <ExternalLink className="w-3 h-3" /> View Map
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
