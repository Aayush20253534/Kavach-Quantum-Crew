import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, CheckCircle2, X, Radio, MapPin } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function SOSButton({ size = 'md', className = '', label = 'SOS EMERGENCY' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  // Handle countdown when modal opens
  useEffect(() => {
    let timer;
    if (isModalOpen && !isDispatched && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isModalOpen && countdown === 0 && !isDispatched) {
      setIsDispatched(true);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, countdown, isDispatched]);

  const handleOpenModal = () => {
    setCountdown(5);
    setIsDispatched(false);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsDispatched(false);
    setCountdown(5);
  };

  const handleImmediateDispatch = () => {
    setCountdown(0);
    setIsDispatched(true);
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-14 px-8 text-base font-bold tracking-wider gap-3',
    floating: 'h-14 w-14 rounded-full p-0 flex items-center justify-center shadow-2xl',
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`relative inline-flex items-center justify-center font-bold text-white rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/40 border border-red-400/50 cursor-pointer active:scale-95 transition-all duration-300 group overflow-hidden ${sizeClasses[size]} ${className}`}
      >
        {/* Pulsing beacon glow */}
        <span className="absolute -inset-1 rounded-2xl bg-red-600/30 blur-sm group-hover:blur-md transition-all animate-pulse" />

        {/* Floating ripple effect for large or floating button */}
        {size === 'floating' ? (
          <div className="relative flex flex-col items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse text-white" />
            <span className="text-[10px] font-black tracking-tighter">SOS</span>
          </div>
        ) : (
          <span className="relative flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </span>
        )}
      </button>

      {/* SOS Confirmation & Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="EMERGENCY SOS DISPATCH"
        className="max-w-lg border-red-500/40 bg-[#0d1526]"
      >
        {!isDispatched ? (
          <div className="space-y-6 text-center py-2">
            <div className="relative mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
              <span className="text-3xl font-black text-red-500">{countdown}</span>
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">Broadcasting Emergency Signal</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Dispatching your current GPS coordinates, tourist ID, and emergency contact alerts to the nearest <strong>Prayagraj Police & Medical Command</strong> in:
              </p>
            </div>

            {/* Live GPS Broadcast preview */}
            <div className="p-3 rounded-xl bg-[#111c30] border border-slate-700/60 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Current Geo-Location</p>
                <p className="text-slate-400 text-[11px]">25.4358° N, 81.8463° E (Triveni Sangam Ghat, Sector 4)</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Cancel ({countdown}s)
              </Button>
              <Button
                variant="danger"
                onClick={handleImmediateDispatch}
                className="flex-1 gap-2"
                leftIcon={PhoneCall}
              >
                Send Immediately
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-emerald-400">Emergency Units Alerted!</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your emergency request has been transmitted with <strong>HIGH PRIORITY</strong>. Nearest response team is dispatched.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-[#111c30] border border-emerald-500/20 text-left text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Incident Ticket:</span>
                <span className="font-mono text-sky-400 font-bold">#SOS-PRY-8924</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Nearest Post:</span>
                <span className="text-slate-200">Sangam Police Assistance Booth (320m)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Arrival:</span>
                <span className="text-emerald-400 font-semibold">&lt; 3 minutes</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Emergency Contacts Notified:</span>
                <span className="text-emerald-400">2 SMS Dispatched</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={handleCancel}
                className="w-full"
              >
                Close Window & Return
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
