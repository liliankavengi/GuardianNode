import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TransactionSimulator from './components/TransactionSimulator';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container">
      <nav className="sidebar">
        <div className="brand">Guardian Node</div>
        
        <button 
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Security Dashboard
        </button>
        <button 
          className={`nav-link ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          API Emulator
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' ? <Dashboard /> : <TransactionSimulator />}
      </main>
    </div>
  );
}

export default App;
