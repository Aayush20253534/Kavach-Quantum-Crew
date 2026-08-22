import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  CheckCircle2, 
  Download, 
  ArrowRight,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function TripHistoryPage() {
  const pastTrips = [
    {
      id: 'TRP-PRY-0982',
      destination: 'Sangam Snan & Maha Kumbh Camp Visit',
      date: '18 Aug 2026',
      duration: '6 Hours 40 Mins',
      type: 'Group Trip (4 Members)',
      safetyScore: '100 / 100',
      status: 'Completed (Incident Free)',
      verifiedOnChain: true,
    },
    {
      id: 'TRP-PRY-0841',
      destination: 'Anand Bhavan & Swaraj Bhavan Heritage Tour',
      date: '12 Aug 2026',
      duration: '4 Hours 15 Mins',
      type: 'Solo Trip',
      safetyScore: '98 / 100',
      status: 'Completed (Incident Free)',
      verifiedOnChain: true,
    },
    {
      id: 'TRP-PRY-0720',
      destination: 'Alopi Devi Mandir & Hanuman Temple Circuit',
      date: '05 Aug 2026',
      duration: '3 Hours 50 Mins',
      type: 'Family Group (3 Members)',
      safetyScore: '100 / 100',
      status: 'Completed (Incident Free)',
      verifiedOnChain: true,
    },
  ];

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Your Travel History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Archived journeys and blockchain safety certificates across Prayagraj.
          </p>
        </div>

        <Link to="/tourist/trips/create">
          <Button variant="primary" size="md" rightIcon={ArrowRight}>
            Plan New Trip
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {pastTrips.map((trip) => (
          <Card key={trip.id} variant="elevated" className="hover:border-sky-500/30 transition">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="safe">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {trip.status}
                    </Badge>
                    <span className="font-mono text-xs text-slate-400 font-bold">{trip.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{trip.destination}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      {trip.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {trip.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {trip.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">Safety Index</p>
                    <p className="text-base font-black text-emerald-400">{trip.safetyScore}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert(`Downloaded safety passport for ${trip.id}`)}
                    leftIcon={Download}
                  >
                    Safety Certificate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
