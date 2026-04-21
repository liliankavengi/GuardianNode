import React, { useState } from 'react';
import { Send, Terminal } from 'lucide-react';
import FraudModal from './FraudModal';

const API_URL = 'http://localhost:3001/api';

function TransactionSimulator() {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  // For demo: allowing the user to mock an admin answer since ngrok might not be running
  const [pendingTxId, setPendingTxId] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setPendingTxId(null);
    
    try {
      const res = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone,
          amount: parseFloat(amount),
          type: 'DISBURSEMENT'
        })
      });
      const data = await res.json();
      setResponse(data);
      if (!data.success && data.txId) {
        setPendingTxId(data.txId);
      }
    } catch (err) {
      setResponse({ success: false, message: "Connection to proxy failed" });
    }
    setLoading(false);
  };

  const handleAdminAction = async (action) => {
    if (!pendingTxId) return;
    try {
      await fetch(`${API_URL}/mock-voice-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: pendingTxId, action })
      });
      setPendingTxId(null);
      setResponse({ success: action === 'approve', message: `Transaction was ${action === 'approve' ? 'approved' : 'denied'} by Admin VIA Voice Callback.` });
    } catch (err) {}
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Terminal className="w-8 h-8 text-cyber-green" />
          API Request Emulator
        </h1>
        <p className="text-text-secondary">Simulates inbound internal backend requests. GuardianNode intercepts these before reaching external providers.</p>
      </div>

      <div className="card p-6 border-t-4 border-cyber-green">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Initiate Transfer</h2>
        </div>

        <form onSubmit={handleSimulate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Recipient Phone Number</label>
            <input 
              type="text" 
              className="w-full bg-navy-base border border-navy-elevated rounded-md px-4 py-3 text-cyber-green font-mono tracking-widest focus:outline-none focus:border-cyber-green focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all" 
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. +254700000000"
              required
            />
            <div className="text-xs text-cyber-green/70 mt-2 font-mono uppercase">
              Confidential Input. (Hint: End with '9' for SIM Swap simulation)
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Transaction Amount (KES)</label>
            <input 
              type="number" 
              className="w-full bg-navy-base border border-navy-elevated rounded-md px-4 py-3 text-white font-mono tracking-widest focus:outline-none focus:border-cyber-green transition-all" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              required
            />
            <div className="text-xs text-text-secondary mt-2 font-mono">
              &gt; 1,000 KES triggers mandatory admin voice authorization.
            </div>
          </div>

          <button type="submit" className="w-full btn-primary py-4 flex justify-center items-center gap-2 group" disabled={loading}>
            {loading ? 'Processing...' : (
               <>Execute Transaction <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
      </div>

      {response && !pendingTxId && (
        <div className={`card p-6 border-l-4 ${response.success ? 'border-cyber-green' : 'border-alert-red'} bg-[#05070a]`}>
          <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 ${response.success ? 'text-cyber-green' : 'text-alert-red'}`}>
            Proxy Response: {response.success ? 'Success' : 'Intervention Failed / Denied'}
          </h2>
          <div className="font-mono text-sm text-text-secondary whitespace-pre-wrap">
            {response.message}
          </div>
          {response.flags && (
            <div className="mt-6 border-t border-navy-elevated pt-4">
              <strong className="text-white text-sm uppercase tracking-wider">Triggered Rules:</strong>
              <ul className="list-disc pl-5 mt-2 text-sm text-alert-red font-mono">
                {response.flags.isHighValue && <li>Velocity: High Value Transaction (&gt;1000 KES)</li>}
                {response.flags.isRisky && <li>InsightsScore: High Risk ({response.flags.reason})</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Render High Visibility Fraud Modal if pendingTxId exists */}
      {pendingTxId && (
        <FraudModal 
           txId={pendingTxId} 
           onAction={handleAdminAction} 
           details={response?.message || "Triggering AT Voice Call to Admin..."}
        />
      )}
    </div>
  );
}

export default TransactionSimulator;
