"use client";

import { Link as LinkIcon, RefreshCw, Trash2, Calendar, DownloadCloud, Building } from 'lucide-react';

export default function BrokeragePage() {
  const handleAddAccount = async () => {
    // Call the skeleton API route we created
    try {
      const res = await fetch('/api/snaptrade');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("SnapTrade integration flow would start here.");
      }
    } catch {
      alert("SnapTrade integration flow would start here.");
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Brokerage Connections</h1>
        <p className="text-muted">Manage your linked accounts and import trades.</p>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2 font-semibold">
            <Building size={20} />
            Brokerage Connections
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold">Connected Accounts (2)</h2>
            <div className="flex gap-2">
              <button className="btn btn-secondary">
                <RefreshCw size={16} />
                Refresh
              </button>
              <button className="btn btn-primary" onClick={handleAddAccount}>
                <LinkIcon size={16} />
                Add Account
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <AccountRow 
              name="Individual Taxable" 
              broker="TD Ameritrade" 
              account="****4892" 
              balance="$142,830.55" 
            />
            <AccountRow 
              name="Margin Account" 
              broker="Interactive Brokers" 
              account="****7731" 
              balance="$218,640.20" 
            />
          </div>

          {/* Sync Section */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
             <h3 className="font-semibold mb-1">Sync & Import Brokerage Data</h3>
             <p className="text-sm text-muted mb-4">Sync all your options, stocks, and ETFs from your connected brokerage.</p>
             
             <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
               <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                 <li style={{ marginBottom: '0.25rem' }}>Set a <span className="font-semibold" style={{color: 'var(--text-primary)'}}>start date</span> below — all activity from that date through today will be imported.</li>
                 <li><span className="font-semibold" style={{color: 'var(--accent-warning)'}}>Note:</span> Brokerage APIs are typically delayed by <span className="font-semibold" style={{color: 'var(--text-primary)'}}>~24 hours</span>, so today&apos;s trades may not appear until tomorrow.</li>
               </ul>
             </div>

             <div className="mb-4">
               <label className="text-sm font-semibold mb-2 block">Import Start Date <span className="text-muted font-normal">(end date is always today)</span></label>
               <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', gap: '0.5rem' }}>
                 <Calendar size={18} className="text-muted" />
                 <span>2/17/2026</span>
               </div>
             </div>

             <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}>
               <DownloadCloud size={18} />
               Sync & Import
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ name, broker, account, balance }: { name: string, broker: string, account: string, balance: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
      <div className="flex items-start gap-4">
        <div style={{ marginTop: '0.25rem', color: 'var(--accent-success)' }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted">{broker} <span style={{ opacity: 0.5 }}>{account}</span></div>
          <div className="text-sm mt-1">Balance: <span className="font-semibold">{balance}</span></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="badge badge-success">Connected</span>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s ease' }} 
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
