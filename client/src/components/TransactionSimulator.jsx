import React, { useState } from 'react';

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
    <div>
      <h1 style={{ marginBottom: '32px' }}>API Request Emulator</h1>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Initiate Transfer Request</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Simulates a request from your backend. GuardianNode proxy will intercept this.
          </p>
        </div>

        <form onSubmit={handleSimulate}>
          <div className="form-group">
            <label className="form-label">Recipient Phone Number (Required)</label>
            <input 
              type="text" 
              className="form-input input-confidential" 
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. +254700000000"
              required
            />
            <div className="confidential-note">
              Confidential Input: Data subject to Insights validation. (Hint: End with '9' to trigger SIM Swap rule)
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Amount (KES)</label>
            <input 
              type="number" 
              className="form-input" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              required
            />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '6px' }}>
              Amounts over 1,000 KES trigger mandatory admin voice authorization.
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Execute Transaction'}
          </button>
        </form>
      </div>

      {response && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Proxy Response</h2>
          </div>
          <div style={{ 
            padding: '16px', 
            backgroundColor: response.success ? 'rgba(0,204,102,0.05)' : 'rgba(255,170,0,0.05)',
            borderLeft: `4px solid ${response.success ? 'var(--color-success)' : 'var(--color-warning)'}`,
            borderRadius: 'var(--border-radius-sm)'
          }}>
            <h3 style={{ marginBottom: '8px', color: response.success ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {response.success ? 'Success' : 'Intervention Required'}
            </h3>
            <p style={{ marginBottom: '8px' }}>{response.message}</p>
            {response.flags && (
              <div style={{ marginTop: '16px' }}>
                <strong>Triggered Rules:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  {response.flags.isHighValue && <li>High Value Transaction (&gt;1000 KES)</li>}
                  {response.flags.isRisky && <li>High Risk Score ({response.flags.reason})</li>}
                </ul>
              </div>
            )}
          </div>
          
          {pendingTxId && (
            <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--color-bg-surface-elevated)', borderRadius: 'var(--border-radius-sm)' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--color-gold-base)' }}>Demo Webhook Simulator</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                In production, Africa's Talking would call your admin's phone. To proceed, simulate the admin's DTMF input below:
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-primary" onClick={() => handleAdminAction('approve')}>
                  Press 1 (Approve)
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleAdminAction('deny')}>
                  Press 2 (Deny & Lock)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionSimulator;
