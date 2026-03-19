"use client";

import { useState } from 'react';
import { Save, PlusCircle } from 'lucide-react';
import { logTrade } from './actions';

export default function LogTradePage({ searchParams }: { searchParams: { error?: string } }) {
  const [strategy, setStrategy] = useState("Covered Call");
  
  const isEquity = strategy === "Long Stock" || strategy === "Short Stock";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Log Trade</h1>
        <p className="text-muted">Use structured templates to manually track your options and equity lifecycle.</p>
      </div>

      {searchParams?.error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--accent-danger-bg)', color: 'var(--accent-danger)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {searchParams.error}
        </div>
      )}

      <form action={logTrade} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
          <PlusCircle className="text-primary" />
          <h2 className="text-xl font-semibold">New Entry Details</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label className="text-sm font-semibold mb-2 block">Strategy Template</label>
            <select name="strategy" required className="form-input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              <optgroup label="Options">
                <option value="Covered Call">Covered Call</option>
                <option value="Cash Secured Put">Cash Secured Put</option>
                <option value="Long Call">Long Call</option>
                <option value="Long Put">Long Put</option>
                <option value="Iron Condor">Iron Condor</option>
                <option value="Credit Spread">Credit Spread</option>
              </optgroup>
              <optgroup label="Equities">
                <option value="Long Stock">Long Stock</option>
                <option value="Short Stock">Short Stock</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Trade Action</label>
            <select name="trade_type" required className="form-input">
              {!isEquity ? (
                <>
                  <option value="STO">Sell to Open (STO)</option>
                  <option value="BTO">Buy to Open (BTO)</option>
                  <option value="STC">Sell to Close (STC)</option>
                  <option value="BTC">Buy to Close (BTC)</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </>
              ) : (
                <>
                  <option value="BUY">Buy Shares</option>
                  <option value="SELL">Sell Shares</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Symbol / Ticker</label>
            <input name="symbol" type="text" placeholder="e.g. AAPL" required className="form-input" />
          </div>

          {!isEquity && (
            <>
              <div>
                <label className="text-sm font-semibold mb-2 block">Strike Price</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                  <input name="strike_price" type="number" step="0.5" placeholder="150.00" required className="form-input" style={{ paddingLeft: '2rem' }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Expiration Date</label>
                <input name="expiration_date" type="date" required className="form-input" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Option Type</label>
                <select name="option_type" required className="form-input">
                  <option value="CALL">Call</option>
                  <option value="PUT">Put</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">Quantity ({isEquity ? 'Shares' : 'Contracts'})</label>
            <input name="quantity" type="number" placeholder="1" required min="1" className="form-input" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Transaction Price / Premium</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
              <input name="price" type="number" step="0.01" placeholder="0.00" required className="form-input" style={{ paddingLeft: '2rem' }} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Total Fees/Commissions</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
              <input name="fees" type="number" step="0.01" placeholder="0.65" defaultValue="0" className="form-input" style={{ paddingLeft: '2rem' }} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Trade Date</label>
            <input name="trade_date" type="date" required className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Trade Notes (Optional)</label>
          <textarea 
            name="notes" 
            placeholder="Document reasoning, record mistakes, or track setup criteria..." 
            rows={4}
            className="form-input"
            style={{ resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            <Save size={18} />
            Log Trade
          </button>
        </div>
      </form>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: #fff;
          font-family: inherit;
          transition: border-color 0.15s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
        .form-input::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
