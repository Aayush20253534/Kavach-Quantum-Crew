import React, { useState, useRef } from 'react';
import { useTriggerSOS } from '../../features/safety/api/safetyQueries';

export function SOSButton() {
  const sosMutation = useTriggerSOS();
  
  const [holding, setHolding] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const holdTimer = useRef(null);

  const startHold = () => {
    if (triggered || sosMutation.isPending) return;
    setHolding(true);
    
    // Require 3 seconds hold
    holdTimer.current = setTimeout(async () => {
      setHolding(false);
      setTriggered(true);
      try {
        await sosMutation.mutateAsync();
        alert('SOS Triggered successfully! Help is on the way.');
      } catch (err) {
        alert('Failed to trigger SOS. Please try again or call emergency services directly.');
        setTriggered(false);
      }
    }, 3000);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  };

  if (triggered && sosMutation.isSuccess) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-full text-center animate-pulse shadow-lg font-bold">
        SOS DISPATCHED
      </div>
    );
  }

  return (
    <button 
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      disabled={sosMutation.isPending || triggered}
      className={`
        w-full p-4 rounded-full font-bold text-white shadow-lg transition-all duration-300 select-none
        ${holding ? 'bg-red-800 scale-95' : 'bg-red-600 hover:bg-red-700 animate-pulse'}
        ${(sosMutation.isPending || triggered) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {sosMutation.isPending ? 'TRANSMITTING...' : holding ? 'HOLD TO TRIGGER...' : 'TAP AND HOLD FOR SOS'}
    </button>
  );
}
