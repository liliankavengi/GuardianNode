import React, { useEffect, useState } from 'react';
import { PhoneCall, AlertOctagon, ShieldAlert } from 'lucide-react';

function FraudModal({ title = 'CRITICAL AUTHORIZATION REQUIRED', details, txId, onAction }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-base/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg card border-alert-red shadow-[0_0_50px_rgba(255,75,75,0.2)] flash-alert bg-navy-surface overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-alert-red px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold tracking-widest text-lg">
            <ShieldAlert className="w-6 h-6" />
            FRAUD INTERCEPTION
          </div>
          <div className="font-mono bg-black/30 px-3 py-1 rounded text-white font-bold">
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="p-8 pb-10 flex flex-col items-center text-center">
          
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-alert-red/20 animate-ping rounded-full"></div>
            <div className="relative bg-navy-base p-6 rounded-full border-2 border-alert-red text-alert-red">
               <AlertOctagon className="w-12 h-12" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
            {title}
          </h2>
          
          <p className="text-text-secondary text-lg mb-6">
            {details || "Triggering AT Voice Call to Admin (+254***789)..."}
          </p>

          <div className="w-full bg-navy-base p-4 rounded-lg border border-alert-red/30 mb-8 flex text-left gap-4 items-start">
             <div className="text-alert-red mt-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 2a9 9 0 0 1 8 7.94" strokeDasharray="3 3"></path><path d="M14.05 6A5 5 0 0 1 18 10" strokeDasharray="3 3"></path></svg>
             </div>
             <div>
                <div className="text-white font-bold mb-1">Awaiting admin input...</div>
                <div className="text-sm text-text-secondary font-mono">TxID: {txId}</div>
                <div className="text-xs text-text-secondary font-mono mt-2">Timeout auto-rejects in {timeLeft}s</div>
             </div>
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => onAction('approve')}
              className="flex-1 bg-navy-base border border-cyber-green text-cyber-green font-bold uppercase tracking-wider py-3 rounded hover:bg-cyber-green/10 transition-colors"
            >
              Force Approve (1)
            </button>
            <button 
              onClick={() => onAction('deny')}
              className="flex-1 btn-danger font-bold uppercase tracking-wider py-3 rounded"
            >
              Kill Request (2)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FraudModal;
