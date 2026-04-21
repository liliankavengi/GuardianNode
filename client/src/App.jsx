import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TransactionSimulator from './components/TransactionSimulator';
import KillSwitch from './components/KillSwitch';
import { Shield, Activity, Phone, TerminalSquare } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-navy-base text-text-primary font-sans overflow-hidden">
      {/* Sidebar */}
      <nav className="w-64 bg-navy-surface border-r border-navy-elevated p-6 flex flex-col gap-6 relative z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-cyber-green" />
          <div className="text-xl font-bold uppercase tracking-widest text-text-primary">
            Guardian<span className="text-cyber-green">Node</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-navy-elevated text-cyber-green border-r-4 border-cyber-green' 
                : 'text-text-secondary hover:text-text-primary hover:bg-navy-elevated/50'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity className="w-5 h-5" />
            Security Pulse
          </button>
          
          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'simulator' 
                ? 'bg-navy-elevated text-cyber-green border-r-4 border-cyber-green' 
                : 'text-text-secondary hover:text-text-primary hover:bg-navy-elevated/50'
            }`}
             onClick={() => setActiveTab('simulator')}
          >
            <TerminalSquare className="w-5 h-5" />
            API Emulator
          </button>

          <button 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'killswitch' 
                ? 'bg-navy-elevated text-alert-red border-r-4 border-alert-red' 
                : 'text-text-secondary hover:text-text-primary hover:bg-navy-elevated/50'
            }`}
             onClick={() => setActiveTab('killswitch')}
          >
            <Phone className="w-5 h-5" />
            Kill Switch Settings
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-navy-elevated">
          <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Systems Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
            <span className="text-sm font-mono text-cyber-green">ONLINE: TESTNET</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 relative">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'simulator' && <TransactionSimulator />}
          {activeTab === 'killswitch' && <KillSwitch />}
        </div>
      </main>
    </div>
  );
}

export default App;
