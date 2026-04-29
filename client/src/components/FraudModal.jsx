import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PhoneCall, AlertOctagon, ShieldAlert } from 'lucide-react';

function FraudModal({ title = 'CRITICAL AUTHORIZATION REQUIRED', details, txId, onAction, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeout) onTimeout();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeout]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-base/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg card border-alert-red shadow-[0_0_50px_rgba(255,75,75,0.2)] flash-alert bg-navy-surface overflow-hidden">

        {/* Header Ribbon */}
        <div className="bg-alert-red px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold tracking-widest text-lg">
            <ShieldAlert className="w-6 h-6" />
            FRAUD INTERCEPTION
          </div>
          <div className={`font-mono bg-black/30 px-3 py-1 rounded font-bold ${timeLeft <= 10 ? 'text-yellow-300 animate-pulse' : 'text-white'}`}>
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
            {details || 'Triggering AT Voice Call to Admin (+254***789)...'}
          </p>

          <div className="w-full bg-navy-base p-4 rounded-lg border border-alert-red/30 mb-8 flex text-left gap-4 items-start">
            <div className="text-alert-red mt-1">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white font-bold mb-1">Awaiting admin input...</div>
              <div className="text-sm text-text-secondary font-mono">TxID: {txId}</div>
              <div className="text-xs text-text-secondary font-mono mt-2">
                Timeout auto-rejects in {timeLeft}s
              </div>
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
              Kill Request (9)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

FraudModal.propTypes = {
  title: PropTypes.string,
  details: PropTypes.string,
  txId: PropTypes.string,
  onAction: PropTypes.func,
  onTimeout: PropTypes.func,
};

export default FraudModal;
