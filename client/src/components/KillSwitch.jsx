import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

function KillSwitch() {
  const [smsFrozen, setSmsFrozen] = useState(false);
  const [airtimeFrozen, setAirtimeFrozen] = useState(false);

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
        
        {/* USSD Box */}
        <div className="card p-6 border-alert-red/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-alert-red" />
                USSD Kill String
              </h2>
              <p className="text-sm text-text-secondary">Dial this string on admin phone to trigger full lockdown.</p>
            </div>
          </div>
          
          <div className="bg-navy-base p-6 rounded border border-alert-red/20 text-center">
            <div className="text-4xl font-mono font-bold text-alert-red tracking-widest">
              *384*100#
            </div>
          </div>
        </div>

        {/* Chain Status Box */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyber-green" />
            Chain Status
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-navy-base rounded border border-navy-elevated">
              <div>
                <div className="font-semibold text-white">Stellar Guardian Protocol</div>
                <div className="text-xs text-text-secondary font-mono mt-1">Status: Monitoring APIs</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-cyber-green/10 rounded-full border border-cyber-green/30">
                <Activity className="w-4 h-4 text-cyber-green animate-pulse" />
                <span className="text-xs font-bold text-cyber-green uppercase tracking-wider">Armed</span>
              </div>
            </div>

            <div className="text-sm text-text-secondary bg-navy-base/50 p-3 flex rounded">
              <span className="text-cyber-green font-bold mr-2">»</span> 
              When a lockdown is initiated, the smart contract rules will reject any new transactions automatically.
            </div>
          </div>
        </div>

        {/* Module Toggles */}
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
