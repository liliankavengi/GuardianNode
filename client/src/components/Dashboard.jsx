import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Box, Terminal, Hash } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [healthScore, setHealthScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`);
      const data = await res.json();
      setLogs(data.logs);
      setHealthScore(data.healthScore);
      
      setHealthData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), score: data.healthScore }];
        return newData.slice(-15); // keep last 15 ticks
      });
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

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
             <Activity className="text-cyber-green animate-pulse" />
             Security Pulse
          </h1>
          <p className="text-text-secondary">Real-time system monitoring and immutable ledger auditing.</p>
        </div>
        <div className="bg-cyber-green/10 border border-cyber-green/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
          <span className="text-sm font-bold text-cyber-green tracking-wider uppercase">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Health & Traffic */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          
          {/* API Health Widget */}
          <div className="card p-6 flex flex-col shrink-0">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${healthScore < 100 ? 'text-alert-red' : 'text-cyber-green'}`} />
              API Health Widget
            </h2>
            <div className="flex items-center gap-8 mb-4">
               <div className="text-6xl font-bold font-mono">
                  <span className={healthScore < 100 ? 'text-alert-red animate-pulse' : 'text-cyber-green'}>{healthScore}%</span>
               </div>
               <div className="text-sm text-text-secondary">
                 Current operational integrity. Drops indicate suspicious traffic, SIM swaps, or velocity rules triggering.
               </div>
            </div>
            <div className="h-24 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={healthData}>
                  <XAxis dataKey="time" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #00FF41' }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke={healthScore < 100 ? '#FF4B4B' : '#00FF41'} 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Traffic Feed */}
          <div className="card p-0 flex flex-col flex-1 min-h-0 border-navy-elevated">
             <div className="p-4 border-b border-navy-elevated bg-navy-surface flex items-center gap-2">
                <Terminal className="w-5 h-5 text-text-secondary" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Traffic Feed</h2>
             </div>
             <div className="flex-1 overflow-y-auto bg-[#05070a] p-4 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-text-secondary text-center mt-10">Listening for API traffic...</div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => {
                       const time = new Date(log.timestamp).toLocaleTimeString();
                       const isBlocked = log.data.status.includes('BLOCKED') || log.data.status.includes('REJECTED');
                       const isPending = log.data.status === 'BLOCKED_PENDING_APPROVAL';
                       let statusColor = 'text-cyber-green';
                       if (isBlocked) statusColor = 'text-alert-red';
                       if (isPending) statusColor = 'text-yellow-500';

                       return (
                         <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded">
                            <span className="text-text-secondary shrink-0">[{time}]</span>
                            <span className="text-blue-400 shrink-0">POST /api/transaction</span>
                            <span className="text-text-primary truncate">
                              Amount: {log.data.amount} KES
                            </span>
                            <span className="shrink-0 mx-2 text-text-secondary">-&gt;</span>
                            <span className={`font-bold ${statusColor} shrink-0`}>
                              [{log.data.status}]
                            </span>
                         </div>
                       )
                    })}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Ledger & Terminal Details */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          
          {/* Blockchain Ledger Panel */}
          <div className="card p-0 flex flex-col flex-1 min-h-0 border-cyber-green/30 shadow-[0_0_20px_rgba(0,255,65,0.05)]">
            <div className="p-4 border-b border-navy-elevated bg-cyber-green/5 flex items-center gap-2">
              <Box className="w-5 h-5 text-cyber-green" />
              <h2 className="text-sm font-bold text-cyber-green uppercase tracking-wider">Blockchain Ledger</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
              {logs.length === 0 && <div className="text-text-secondary text-center mt-10">No blocks minted.</div>}
              {logs.map(log => (
                <div key={log.id + 'ledger'} className="bg-navy-base border border-navy-elevated p-3 rounded hover:border-cyber-green/50 transition-colors">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-navy-elevated uppercase text-[0.65rem] text-text-secondary font-bold tracking-widest">
                    <span>Stellar Testnet</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-3 h-3 text-cyber-green" />
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${log.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cyber-green hover:underline truncate"
                      title="View on Stellar Expert"
                    >
                      {log.id.substring(0, 24)}...
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary mt-2 pt-2 border-t border-navy-elevated/50">
                    {log.data.status === 'APPROVED' ? (
                      <><CheckCircle2 className="w-4 h-4 text-cyber-green" /> Verified Entry</>
                    ) : (
                      <><ShieldAlert className="w-4 h-4 text-alert-red" /> Immutable Audit Ref: Blocked</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Raw JSON Terminal */}
          <div className="card p-0 shrink-0 h-48 border-navy-elevated bg-[#05070a] flex flex-col">
             <div className="p-2 border-b border-navy-elevated bg-navy-base text-[0.65rem] text-text-secondary uppercase tracking-widest px-4">
                Raw Output Hook: Africa's Talking
             </div>
             <div className="p-4 overflow-y-auto font-mono text-xs text-text-secondary whitespace-pre-wrap flex-1">
               {logs.length > 0 ? (
                 JSON.stringify({
                   response: logs[0].data,
                   network: "NGROK_TUNNEL_ACTIVE",
                   timestamp: logs[0].timestamp
                 }, null, 2)
               ) : (
                 "Awaiting API payloads..."
               )}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
