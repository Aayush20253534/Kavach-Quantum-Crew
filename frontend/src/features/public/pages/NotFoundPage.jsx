import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060B16] text-white p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The safety portal route you requested does not exist or has been relocated within the Prayagraj grid.
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={Home}>
            Return Home
          </Button>
        </Link>
        <Link to="/tourist/dashboard">
          <Button variant="secondary">
            Tourist Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
