'use client';
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, X, Trash2 } from 'lucide-react';

type Trade = {
  id: string;
  symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  fees?: number;
  trade_date?: string;
  notes?: string;
};

type Position = {
  id: string;
  symbol: string;
  asset_type: string;
  strategy?: string;
  status: string;
  realized_pl?: number;
  total_fees?: number;
  adjusted_cost_basis?: number;
  open_quantity?: number;
  closed_quantity?: number;
  created_at?: string;
  trades?: Trade[];
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PositionModal({ position, onClose }: { position: Position; onClose: () => void }) {
  const trades = position.trades || [];
  const pl = position.realized_pl ?? 0;
  const fees = position.total_fees ?? 0;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{position.symbol}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{position.strategy || 'Long Stock'}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ backgroundColor: position.status === 'OPEN' ? '#3b82f6' : '#6b7280', color: '#fff', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>{position.status}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', backgroundColor: 'var(--border-color)' }}>
          {[
            { label: position.status === 'OPEN' ? 'COST BASIS' : 'NET P/L', value: position.status === 'OPEN' ? `$${(position.adjusted_cost_basis ?? 0).toFixed(2)}` : `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`, color: pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'var(--text-primary)' },
            { label: 'OPEN QTY', value: `${position.open_quantity ?? 0} shares`, color: 'var(--text-primary)' },
            { label: 'TOTAL FEES', value: `$${fees.toFixed(2)}`, color: '#f87171' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trades.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem 0' }}>No executions linked to this position.</p>
          ) : trades.map((trade, i) => {
            const isBuy = /BUY|BTO/i.test(trade.trade_type);
            const tradePL = !isBuy ? trade.price * trade.quantity : null;
            const dotColor = i === 0 ? '#3b82f6' : isBuy ? '#10b981' : '#f87171';
            const label = i === 0 ? 'Latest' : isBuy ? 'Buy' : 'Sell';

            return (
              <div key={trade.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: dotColor }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(trade.trade_date)}</span>
                  </div>
                  {tradePL !== null && (
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>+${tradePL.toFixed(2)}</span>
                  )}
                </div>
                {trade.fees != null && trade.fees > 0 && (
                  <div style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#f87171' }}>⊖ ${trade.fees.toFixed(2)} fees</div>
                )}
                <div style={{ paddingLeft: '1.25rem', display: 'inline-flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, width: 'fit-content' }}>
                  <span style={{ color: isBuy ? '#10b981' : '#f87171' }}>{isBuy ? '+' : '-'}{trade.quantity}</span>
                  <span style={{ color: 'var(--text-muted)' }}>@ ${trade.price.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{trade.trade_type.toUpperCase()}</span>
                </div>
                {trade.notes && (
                  <div style={{ marginLeft: '1.25rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.6rem 0.875rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    📄 {trade.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Trash2 size={16} /> Delete Position
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EquitiesClient({ positions }: { positions: Position[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const filtered = useMemo(() => positions.filter(p => {
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  }), [positions, search, statusFilter]);

  const totalRealizedPL = positions.filter(p => p.status === 'CLOSED').reduce((s, p) => s + (p.realized_pl ?? 0), 0);
  const totalCostBasis = positions.filter(p => p.status === 'OPEN').reduce((s, p) => s + (p.adjusted_cost_basis ?? 0), 0);
  const openCount = positions.filter(p => p.status === 'OPEN').length;
  const inputStyle = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', padding: '0.6rem 1rem', outline: 'none' };

  return (
    <>
      {selectedPosition && <PositionModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Positions', value: positions.length.toString(), sub: `${openCount} open` },
          { label: 'Open Cost Basis', value: `$${totalCostBasis.toFixed(2)}`, sub: 'Sum of open positions' },
          { label: 'Realized P/L', value: `${totalRealizedPL >= 0 ? '+' : ''}$${totalRealizedPL.toFixed(2)}`, sub: 'Closed positions only', positive: totalRealizedPL >= 0 },
          { label: 'Open Holdings', value: openCount.toString(), sub: 'Currently active' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: (s as any).positive === true ? '#10b981' : (s as any).positive === false ? '#f87171' : 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search ticker..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: '100%', paddingLeft: '2rem' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, minWidth: '140px' }}>
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>All Equity Positions</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filtered.length} positions</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {['Symbol', 'Strategy', 'Open Qty', 'Cost Basis', 'Status', 'Realized P/L'].map(col => (
                <th key={col} style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No equity positions match your filters.</td></tr>
            ) : filtered.map(pos => (
              <tr key={pos.id} onClick={() => setSelectedPosition(pos)} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{pos.symbol}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{pos.strategy || 'Long Stock'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{pos.open_quantity ?? '—'}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{pos.adjusted_cost_basis != null ? `$${Number(pos.adjusted_cost_basis).toFixed(2)}` : '—'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ backgroundColor: pos.status === 'OPEN' ? '#3b82f633' : '#6b728033', border: `1px solid ${pos.status === 'OPEN' ? '#3b82f655' : '#6b728055'}`, color: pos.status === 'OPEN' ? '#3b82f6' : '#9ca3af', borderRadius: '10px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {pos.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: (pos.realized_pl ?? 0) > 0 ? '#10b981' : (pos.realized_pl ?? 0) < 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {pos.status === 'OPEN' ? <span style={{ color: 'var(--text-muted)' }}>Open</span> : `${(pos.realized_pl ?? 0) >= 0 ? '+' : ''}$${Math.abs(pos.realized_pl ?? 0).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
