import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Send, Terminal, MessageSquare, ShieldCheck, ShieldOff } from 'lucide-react';
import FraudModal from './FraudModal';

const API_URL = 'http://localhost:3001/api';

const SMS_MESSAGES = {
  approved: `Transaction Verified & Logged to Stellar! 🛡️ Quick Tip: Did you know that using a unique PIN for your bank and your phone makes you 80% harder to hack? Stay safe with #GuardianAcademy.`,
  blocked:  `Security Alert: Transaction Blocked by GuardianNode. 🛡️ Education: Someone may be trying to access your account. Dial *384*17088# and select 'Security School' to learn how to lock your SIM.`
};

function EducationCard({ status }) {
  const isApproved = status === 'approved';
  return (
    <div className={`card p-5 border-l-4 ${isApproved ? 'border-cyber-green' : 'border-alert-red'} bg-[#05070a]`}>
      <div className={`flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider ${isApproved ? 'text-cyber-green' : 'text-alert-red'}`}>
        {isApproved ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
        <MessageSquare className="w-4 h-4" />
        SMS sent to recipient
      </div>
      <p className="font-mono text-sm text-text-secondary leading-relaxed">
        {SMS_MESSAGES[status]}
      </p>
    </div>
  );
}

EducationCard.propTypes = {
  status: PropTypes.oneOf(['approved', 'blocked']).isRequired,
};

function TransactionSimulator() {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [pendingTxId, setPendingTxId] = useState(null);
  const [educationStatus, setEducationStatus] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setPendingTxId(null);
    setEducationStatus(null);

    try {
      const res = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone, amount: Number.parseFloat(amount), type: 'DISBURSEMENT' })
      });
      const data = await res.json();
      setResponse(data);
      if (!data.success && data.txId) {
        setPendingTxId(data.txId);
      } else if (data.success) {
        setEducationStatus('approved');
      }
    } catch {
      setResponse({ success: false, message: 'Connection to proxy failed' });
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
    } catch { /* server unreachable */ }

    setPendingTxId(null);
    setResponse({
      success: action === 'approve',
      message: `Transaction was ${action === 'approve' ? 'approved' : 'denied'} by Admin via Voice Callback.`
    });
    setEducationStatus(action === 'approve' ? 'approved' : 'blocked');
  };

  const handleTimeout = () => {
    setPendingTxId(null);
    setResponse({ success: false, message: 'No admin response — transaction auto-rejected after 60s timeout.' });
    setEducationStatus('blocked');
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Terminal className="w-8 h-8 text-cyber-green" />
          API Request Emulator
        </h1>
        <p className="text-text-secondary">
          Simulates inbound internal backend requests. GuardianNode intercepts these before reaching external providers.
        </p>
      </div>

      <div className="card p-6 border-t-4 border-cyber-green">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Initiate Transfer</h2>
        </div>

        <form onSubmit={handleSimulate} className="space-y-6">
          <div>
            <label htmlFor="recipientPhone" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Recipient Phone Number
            </label>
            <input
              id="recipientPhone"
              type="text"
              className="w-full bg-navy-base border border-navy-elevated rounded-md px-4 py-3 text-cyber-green font-mono tracking-widest focus:outline-none focus:border-cyber-green focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. +254700000000"
              required
            />
            <div className="text-xs text-cyber-green/70 mt-2 font-mono uppercase">
              Confidential Input. (Hint: End with &apos;9&apos; for SIM Swap simulation)
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Transaction Amount (KES)
            </label>
            <input
              id="amount"
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

          <button
            type="submit"
            className="w-full btn-primary py-4 flex justify-center items-center gap-2 group"
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>Execute Transaction <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
      </div>

      {/* Proxy response card */}
      {response && !pendingTxId && (
        <div className={`card p-6 border-l-4 ${response.success ? 'border-cyber-green' : 'border-alert-red'} bg-[#05070a]`}>
          <h2 className={`text-lg font-bold uppercase tracking-wider mb-4 ${response.success ? 'text-cyber-green' : 'text-alert-red'}`}>
            Proxy Response: {response.success ? 'Success' : 'Intervention / Denied'}
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
                {response.flags.isSimSwapRecent && <li>SIM Swap detected within 48 hours</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Education SMS preview — shown after every terminal state */}
      {educationStatus && !pendingTxId && (
        <EducationCard status={educationStatus} />
      )}

      {pendingTxId && (
        <FraudModal
          txId={pendingTxId}
          onAction={handleAdminAction}
          onTimeout={handleTimeout}
          details={response?.message || 'Triggering AT Voice Call to Admin...'}
        />
      )}
    </div>
  );
}

export default TransactionSimulator;
