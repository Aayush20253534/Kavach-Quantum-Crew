import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function IncidentHistoryPage() {
  const incidents = [
    {
      id: 'INC-PRY-9421',
      category: 'Crowd Surge at Ghat 4',
      date: 'Today, 10:15 AM',
      location: 'Sangam Sector 4 Ghats',
      status: 'Dispatched',
      severity: 'High',
      policeNote: 'Patrol PCR #14 en route to manage barricades.',
    },
    {
      id: 'INC-PRY-8102',
      category: 'Unauthorized Boat Fare Overcharging',
      date: '14 Aug 2026, 03:20 PM',
      location: 'Qila Ghat Boat Stand',
      status: 'Resolved',
      severity: 'Medium',
      policeNote: 'Tourist assistance booth resolved issue and refunded excess fare.',
    },
    {
      id: 'INC-PRY-7619',
      category: 'Lost Child Assistance',
      date: '08 Aug 2026, 11:45 AM',
      location: 'Kumbh Sector 2 Mela Ground',
      status: 'Resolved',
      severity: 'High',
      policeNote: 'Child safely reunited with family via Khoya-Paya booth sync.',
    },
  ];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Reported Incidents & Status</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status tracking and police investigation logs.
          </p>
        </div>

        <Link to="/tourist/incidents/report">
          <Button variant="danger" size="md" leftIcon={AlertTriangle}>
            Report New Incident
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {incidents.map((inc) => (
          <Card key={inc.id} variant="elevated" className="hover:border-slate-700 transition">
            <CardContent className="p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-400">{inc.id}</span>
                  <Badge
                    variant={inc.status === 'Resolved' ? 'safe' : inc.status === 'Dispatched' ? 'warning' : 'critical'}
                    className="text-[10px]"
                  >
                    {inc.status}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {inc.date}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{inc.category}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {inc.location}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#080d18] border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">Authority Response Note:</span>
                <p className="text-slate-200">{inc.policeNote}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
