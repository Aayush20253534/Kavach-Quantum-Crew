import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon, PhoneCall, CheckCircle2, Radio, MapPin, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { safetyService } from '../../features/safety/api/safetyService';
import { tripService } from '../../features/trips/api/tripService';
import { getEmergencyLocation } from '../../features/safety/utils/emergencyLocation';

export function SOSButton({ size = 'md', className = '', label = 'SOS EMERGENCY' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const dispatchStartedRef = useRef(false);

  const dispatchSOS = async () => {
    if (dispatchStartedRef.current) return;
    dispatchStartedRef.current = true;
    setIsDispatching(true);
    setDispatchError('');

    try {
      const trip = await tripService.getCurrentTrip();
      if (!trip || trip.status !== 'ACTIVE') {
        throw new Error('Start an active trip before sending SOS so emergency staff can track the incident.');
      }

      const location = await getEmergencyLocation();
      setCurrentLocation(location);

      const result = await safetyService.triggerSOS({
        tripId: trip.id,
        emergencyType: 'OTHER',
        message: 'Emergency SOS triggered from the tourist application.',
        ...(location || {}),
      });

      setDispatchResult(result);
      setIsDispatched(true);
    } catch (error) {
      setDispatchError(error?.response?.data?.error?.message || error.message || 'Unable to send SOS.');
      dispatchStartedRef.current = false;
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isModalOpen && !isDispatched && !isDispatching && !dispatchError && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (isModalOpen && countdown === 0 && !isDispatched && !isDispatching && !dispatchError) {
      void dispatchSOS();
    }
    return () => window.clearInterval(timer);
  }, [isModalOpen, countdown, isDispatched, isDispatching, dispatchError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenModal = () => {
    dispatchStartedRef.current = false;
    setCountdown(5);
    setIsDispatched(false);
    setIsDispatching(false);
    setDispatchError('');
    setDispatchResult(null);
    setCurrentLocation(null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsDispatched(false);
    setIsDispatching(false);
    setDispatchError('');
    setCountdown(5);
    dispatchStartedRef.current = false;
  };

  const handleImmediateDispatch = () => {
    setCountdown(0);
    setDispatchError('');
    void dispatchSOS();
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-14 px-8 text-base font-bold tracking-wider gap-3',
    floating: 'h-14 w-14 rounded-full p-0 flex items-center justify-center shadow-2xl',
  };

  const incident = dispatchResult?.incident;
  const sos = dispatchResult?.sos;

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`relative inline-flex items-center justify-center font-bold text-white rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/40 border border-red-400/50 cursor-pointer active:scale-95 transition-all duration-300 group overflow-hidden ${sizeClasses[size]} ${className}`}
      >
        <span className="absolute -inset-1 rounded-2xl bg-red-600/30 blur-sm group-hover:blur-md transition-all animate-pulse" />

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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="EMERGENCY SOS DISPATCH"
        className="max-w-lg border-red-500/40 bg-[#0d1526]"
      >
        {!isDispatched ? (
          <div className="space-y-6 text-center py-2">
            <div className="relative mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
              {isDispatching ? <Loader2 className="w-8 h-8 animate-spin text-red-400" /> : <span className="text-3xl font-black text-red-500">{countdown}</span>}
              {!isDispatching && <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25" />}
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">{isDispatching ? 'Sending Emergency Signal' : 'Broadcasting Emergency Signal'}</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your active trip and current GPS position will be sent to Disaster Management as a critical incident.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#111c30] border border-slate-700/60 flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Current Geo-Location</p>
                <p className="text-slate-400 text-[11px]">
                  {currentLocation
                    ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                    : 'GPS will be captured when SOS is sent'}
                </p>
              </div>
            </div>

            {dispatchError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-xs text-red-300">
                {dispatchError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isDispatching}
                className="flex-1 border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Cancel {countdown > 0 && !dispatchError ? `(${countdown}s)` : ''}
              </Button>
              <Button
                variant="danger"
                onClick={handleImmediateDispatch}
                disabled={isDispatching}
                className="flex-1 gap-2"
                leftIcon={isDispatching ? Loader2 : PhoneCall}
              >
                {dispatchError ? 'Retry SOS' : isDispatching ? 'Sending…' : 'Send Immediately'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-emerald-400">SOS Incident Created</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Disaster Management has received the incident as <strong>CRITICAL</strong> and it is now available in the live incident queue.
              </p>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-[#111c30] border border-emerald-500/20 text-left text-xs">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Incident Ticket:</span>
                <span className="font-mono text-sky-400 font-bold">{incident?.id ? `#${incident.id.slice(0, 8).toUpperCase()}` : 'Created'}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>SOS Request:</span>
                <span className="font-mono text-slate-200">{sos?.id ? sos.id.slice(0, 8) : '—'}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Queue Status:</span>
                <span className="text-emerald-400 font-semibold">{incident?.status || 'OPEN'}</span>
              </div>
            </div>

            <Button variant="secondary" onClick={handleCancel} className="w-full">
              Close Window & Return
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
