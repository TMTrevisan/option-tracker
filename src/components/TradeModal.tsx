"use client";

import { Link2, Trash2, FileText, ArrowRight } from 'lucide-react';
import { Position, Trade } from '@/lib/types';

interface TradeModalProps {
  position?: Position;
  trades?: Trade[];
}

export default function TradeModal({ position, trades }: TradeModalProps) {
  if (!position) {
    return (
      <div style={{ backgroundColor: '#101622', border: '1px solid #1e293b', borderRadius: '12px', width: '100%', maxWidth: '750px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No positions available to view. Log your first trade.
      </div>
    );
  }

  // Ensure trades exist and are sorted newest first (descending)
  const sortedTrades = [...(trades || [])].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());

  // Helper formatting 
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatOptionTag = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div style={{ backgroundColor: '#101622', border: '1px solid #1e293b', borderRadius: '12px', width: '100%', maxWidth: '750px', margin: '0 auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyItems: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{position.symbol}</h2>
          <Link2 size={16} className="text-primary" />
        </div>
        <div className="text-muted font-medium ml-8 flex-1">{position.strategy}</div>
        <div className={`badge ${position.status === 'OPEN' ? 'badge-primary' : position.status === 'CLOSED' ? 'badge-dark' : 'badge-purple'}`} style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}>
          {position.status}
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="text-xs text-muted font-semibold mb-2" style={{ letterSpacing: '0.05em' }}>NET PREMIUM</div>
            <div className="font-bold text-success text-lg">${position.total_premium_kept.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="text-xs text-muted font-semibold mb-2" style={{ letterSpacing: '0.05em' }}>AVG COST</div>
            <div className="font-bold text-lg">${position.adjusted_cost_basis.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="text-xs text-muted font-semibold mb-2" style={{ letterSpacing: '0.05em' }}>TOTAL FEES</div>
            <div className="font-bold text-danger text-lg">${position.total_fees.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="text-xs text-muted font-semibold mb-2" style={{ letterSpacing: '0.05em' }}>REALIZED P/L</div>
            <div className={`font-bold text-lg ${position.realized_pl >= 0 ? 'text-success' : 'text-danger'}`}>
              {position.realized_pl >= 0 ? '+' : '-'}${Math.abs(position.realized_pl).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {/* Vertical Track line */}
          <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '20px', width: '2px', backgroundColor: '#1e293b' }} />
          
          {sortedTrades.map((trade, index) => {
            const isLatest = index === 0;
            const isClosingRow = ['STC', 'BTC', 'ASSIGNMENT', 'EXERCISE'].includes(trade.trade_type);
            const colorVar = isClosingRow ? 'var(--accent-purple)' : 'var(--accent-success)';
            const cashImpact = trade.price * trade.quantity * (position.asset_type === 'OPTION' ? 100 : 1);
            
            return (
              <div key={trade.id} style={{ position: 'relative', marginBottom: index !== sortedTrades.length - 1 ? '3rem' : '1rem' }}>
                <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colorVar, zIndex: 1, border: '2px solid #101622' }} />
                
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base" style={{ color: colorVar }}>{trade.trade_type}</span>
                    <span className="text-muted text-sm">{formatDate(trade.trade_date)}</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: ['BTO', 'BUY', 'BTC'].includes(trade.trade_type) ? 'var(--accent-danger)' : 'var(--accent-success)'}}>
                    {['BTO', 'BUY', 'BTC'].includes(trade.trade_type) ? '-' : '+'}${cashImpact.toFixed(2)}
                  </div>
                </div>
                
                {trade.fees > 0 && (
                  <div className="text-danger text-sm flex items-center gap-1 mb-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    ${trade.fees.toFixed(2)} <span className="text-muted">fees</span>
                  </div>
                )}

                {position.asset_type === 'OPTION' && trade.option_type && (
                  <div className="flex items-center gap-0 text-sm mb-3 mt-2" style={{ backgroundColor: '#1c273c', display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                    <div style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid #1e293b' }}>{trade.quantity}</div>
                    <div style={{ padding: '0.25rem 0.75rem', borderRight: '1px solid #1e293b' }}>{trade.expiration_date ? formatOptionTag(trade.expiration_date) : '--/--'}</div>
                    <div style={{ padding: '0.25rem 0.75rem', fontWeight: 'bold', borderRight: '1px solid #1e293b' }}>${trade.strike_price}</div>
                    <div style={{ padding: '0.25rem 0.75rem', color: trade.option_type === 'CALL' ? '#fb923c' : '#38bdf8', fontWeight: 'bold', borderRight: '1px solid #1e293b' }}>{trade.option_type?.charAt(0)}</div>
                    <div style={{ padding: '0.25rem 0.75rem', color: colorVar, fontSize: '0.75rem', fontWeight: 'bold' }}>{trade.trade_type}</div>
                  </div>
                )}

                {trade.trade_type === 'ASSIGNMENT' && position.asset_type === 'OPTION' && (
                  <div className="text-sm mt-1 mb-3" style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>↳</span>
                    <span className="font-semibold">{trade.option_type === 'CALL' ? `Called away at $${trade.strike_price}` : `Assigned shares at $${trade.strike_price}`}</span>
                  </div>
                )}

                {trade.notes && (
                  <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#151d2c', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    <FileText size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{trade.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
