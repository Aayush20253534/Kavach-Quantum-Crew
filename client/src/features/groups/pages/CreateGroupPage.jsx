import React from 'react';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CreateGroupPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <Users className="w-10 h-10 mx-auto text-indigo-600" />
        <h1 className="text-xl font-black mt-4">Create a Group Trip</h1>
        <p className="text-sm text-slate-500 mt-2">
          Groups are created automatically when you plan a GROUP trip, so the trip and group lifecycle remain consistent.
        </p>
        <Link to="/tourist/trips/create" className="inline-block mt-6 px-6 py-3 rounded-lg bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
          Plan Group Trip
        </Link>
      </div>
    </div>
  );
}
