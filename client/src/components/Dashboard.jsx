import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [healthScore, setHealthScore] = useState(100);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`);
      const data = await res.json();
      setLogs(data.logs);
      setHealthScore(data.healthScore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getHealthClass = (score) => {
    if (score >= 90) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Security Monitoring</h1>
        <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>Decentralized Audit Active</span>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Health Score</h2>
        </div>
        <div className="health-monitor">
          <div className={`health-score ${getHealthClass(healthScore)}`}>
            {healthScore}%
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Real-time evaluation based on anomalous API access attempts.
            </p>
            {healthScore < 100 && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                System under pressure. Suspicious activity detected recently.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 className="card-title">Immutable Audit Trail (Stellar Ledger)</h2>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Auto-refreshing...</span>
        </div>
        
        {loading && logs.length === 0 ? (
          <p>Loading ledger...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>TX Hash (ID)</th>
                  <th>Type</th>
                  <th>Amount (KES)</th>
                  <th>Status / Signatures</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No events recorded yet.
                    </td>
                  </tr>
                )}
                {logs.map((log) => {
                  let badgeClass = 'badge-info';
                  if (log.data.status === 'APPROVED' || log.data.status === 'APPROVED_BY_ADMIN') badgeClass = 'badge-success';
                  if (log.data.status.includes('REJECTED') || log.data.status.includes('BLOCKED')) badgeClass = 'badge-danger';
                  if (log.data.status === 'BLOCKED_PENDING_APPROVAL') badgeClass = 'badge-warning';

                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="mono" title="Stellar Transaction Hash">
                        {log.id.substring(0, 16)}...
                      </td>
                      <td>{log.data.type || 'N/A'}</td>
                      <td>{log.data.amount || '-'}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{log.data.status.replace(/_/g, ' ')}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
