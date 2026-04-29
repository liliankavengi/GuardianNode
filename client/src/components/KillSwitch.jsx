import React, { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, Activity, ShieldOff } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

function KillSwitch() {
  const [systemArmed, setSystemArmed] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [smsFrozen, setSmsFrozen] = useState(false);
  const [airtimeFrozen, setAirtimeFrozen] = useState(false);

  // Poll system status every 5 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system-status`);
        const data = await res.json();
        setSystemArmed(data.armed);
        setPendingCount(data.pendingCount);
      } catch {
        // Server unreachable — don't crash the UI
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSystemArmed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/system-arm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arm: !systemArmed })
      });
      const data = await res.json();
      setSystemArmed(data.armed);
    } catch (e) {
      console.error('Failed to toggle system state:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <PhoneCall className="w-8 h-8 text-alert-red" />
          Emergency USSD Controls
        </h1>
        <p className="text-text-secondary">
          Manage out-of-band administration systems to lock down APIs remotely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* USSD Kill String */}
        <div className="card p-6 border-alert-red/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-alert-red" />
                USSD Kill String
              </h2>
              <p className="text-sm text-text-secondary">
                Dial from admin phone to trigger remote lockdown.
              </p>
            </div>
          </div>
          <div className="bg-navy-base p-6 rounded border border-alert-red/20 text-center mb-4">
            <div className="text-4xl font-mono font-bold text-alert-red tracking-widest">
              *384*17088#
            </div>
          </div>
          <div className="text-xs text-text-secondary font-mono bg-navy-base/50 p-3 rounded space-y-1">
            <div><span className="text-cyber-green">1</span> → ARM System (normal operation)</div>
            <div><span className="text-alert-red">2</span> → Emergency Lockdown (block all)</div>
            <div><span className="text-text-secondary">3</span> → Check current status</div>
          </div>
        </div>

        {/* Chain Status */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyber-green" />
            Chain Status
          </h2>

          <div className="space-y-4">
            {/* System ARM indicator */}
            <div className={`flex items-center justify-between p-4 bg-navy-base rounded border ${systemArmed ? 'border-cyber-green/30' : 'border-alert-red/50'}`}>
              <div>
                <div className="font-semibold text-white">GuardianNode System</div>
                <div className="text-xs text-text-secondary font-mono mt-1">
                  {pendingCount > 0
                    ? `${pendingCount} transaction(s) awaiting voice approval`
                    : 'No pending transactions'}
                </div>
              </div>
              {systemArmed ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-cyber-green/10 rounded-full border border-cyber-green/30">
                  <Activity className="w-4 h-4 text-cyber-green animate-pulse" />
                  <span className="text-xs font-bold text-cyber-green uppercase tracking-wider">Armed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-alert-red/10 rounded-full border border-alert-red/30">
                  <ShieldOff className="w-4 h-4 text-alert-red animate-pulse" />
                  <span className="text-xs font-bold text-alert-red uppercase tracking-wider">Locked Down</span>
                </div>
              )}
            </div>

            {/* Dashboard ARM/DISARM toggle */}
            {(() => {
              const btnLabel = loading ? 'Updating...' : (systemArmed ? 'Trigger Emergency Lockdown' : 'Re-ARM System');
              const btnClass = systemArmed
                ? 'bg-alert-red/20 border border-alert-red/40 text-alert-red hover:bg-alert-red/30'
                : 'bg-cyber-green/20 border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/30';
              return (
                <button
                  onClick={toggleSystemArmed}
                  disabled={loading}
                  className={`w-full py-3 rounded font-bold uppercase tracking-wider text-sm transition-all ${btnClass} disabled:opacity-50`}
                >
                  {btnLabel}
                </button>
              );
            })()}

            {!systemArmed && (
              <div className="font-mono text-sm text-alert-red border-l-4 border-alert-red pl-4 py-1 animate-pulse">
                [CRITICAL]: SYSTEM IN EMERGENCY LOCKDOWN. ALL TRANSACTIONS BLOCKED.
              </div>
            )}
          </div>
        </div>

        {/* API Module Toggles */}
        <div className="card p-6 md:col-span-2">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6">API Modules Configuration</h2>

          <div className="space-y-4">
            {/* SMS API Toggle */}
            <div className="flex items-center justify-between p-4 bg-navy-base rounded border border-navy-elevated">
              <div>
                <div className="font-bold text-white text-lg">Send SMS API</div>
                <div className="text-sm text-text-secondary">Africa's Talking messaging endpoints</div>
              </div>
              <button
                onClick={() => setSmsFrozen(!smsFrozen)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${smsFrozen ? 'bg-alert-red' : 'bg-cyber-green'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${smsFrozen ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Airtime API Toggle */}
            <div className="flex items-center justify-between p-4 bg-navy-base rounded border border-navy-elevated">
              <div>
                <div className="font-bold text-white text-lg">Airtime Out API</div>
                <div className="text-sm text-text-secondary">Africa's Talking airtime disbursement endpoints</div>
              </div>
              <button
                onClick={() => setAirtimeFrozen(!airtimeFrozen)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${airtimeFrozen ? 'bg-alert-red' : 'bg-cyber-green'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${airtimeFrozen ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {(smsFrozen || airtimeFrozen) && (
            <div className="mt-6 font-mono text-sm text-alert-red border-l-4 border-alert-red pl-4 py-1 animate-pulse">
              [WARNING]: SOME MODULES ARE CURRENTLY FROZEN. API REQUESTS WILL BE DROPPED.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default KillSwitch;
