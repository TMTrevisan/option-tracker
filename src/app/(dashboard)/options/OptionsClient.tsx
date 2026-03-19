'use client';
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Eye, EyeOff, X, BookOpen, Trash2 } from 'lucide-react';

type Trade = {
  id: string;
  symbol: string;
  trade_type: string;
  option_type?: string;
  quantity: number;
  price: number;
  fees?: number;
  trade_date?: string;
  expiration_date?: string;
  strike_price?: number;
  notes?: string;
  position_id?: string;
};

type Position = {
  id: string;
  symbol: string;
  asset_type: string;
  strategy?: string;
  status: string;
  realized_pl?: number;
  total_fees?: number;
  total_premium_kept?: number;
  adjusted_cost_basis?: number;
  open_quantity?: number;
  closed_quantity?: number;
  created_at?: string;
  trades?: Trade[];
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  CLOSED: '#6b7280',
  ASSIGNED: '#8b5cf6',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TradeChip({ trade }: { trade: Trade }) {
  const isBuy = /BTO|BUY|BTC|COVER/i.test(trade.trade_type);
  const optType = trade.option_type?.toUpperCase();
  const qty = isBuy ? `+${trade.quantity}` : `-${trade.quantity}`;
  const exp = trade.expiration_date ? new Date(trade.expiration_date) : null;
  const expStr = exp ? `${exp.getMonth() + 1}/${exp.getDate()}` : '—';
  const dte = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null;

  return (
    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.25rem 0.65rem', fontSize: '0.78rem', fontWeight: 600 }}>
      <span style={{ color: isBuy ? '#10b981' : '#f87171' }}>{qty}</span>
      <span style={{ color: 'var(--text-muted)' }}>{expStr}</span>
      {dte !== null && <span style={{ color: 'var(--text-muted)' }}>{dte}d</span>}
      {trade.strike_price && <span style={{ color: 'var(--text-primary)' }}>${trade.strike_price}</span>}
      {optType && <span style={{ color: optType === 'CALL' ? '#60a5fa' : '#a78bfa' }}>{optType[0]}</span>}
      <span style={{ color: 'var(--text-muted)' }}>{trade.trade_type.toUpperCase()}</span>
    </div>
  );
}

function PositionModal({ position, onClose }: { position: Position; onClose: () => void }) {
  const trades = position.trades || [];
  const pl = position.realized_pl ?? 0;
  const fees = position.total_fees ?? 0;
  const avgPrice = trades.length > 0 ? trades.reduce((s, t) => s + t.price, 0) / trades.length : 0;
  const statusColor = STATUS_COLORS[position.status] || '#6b7280';

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#0f1117', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{position.symbol}</span>
            <BookOpen size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{position.strategy || 'Option Trade'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ backgroundColor: statusColor, color: '#fff', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>{position.status}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex' }}><X size={20} /></button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label: position.status === 'OPEN' ? 'OPEN P/L' : 'NET P/L', value: position.status === 'OPEN' ? 'N/A' : `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`, color: pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'rgba(255,255,255,0.7)' },
            { label: 'AVG TRD PR', value: `$${avgPrice.toFixed(2)}`, color: '#10b981' },
            { label: 'TOTAL FEES', value: `$${fees.toFixed(2)}`, color: '#f87171' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '1rem 1.25rem', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Trade Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {trades.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', padding: '2.5rem 0' }}>
              <p>No trade executions linked to this position.</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Run Sync &amp; Import to pull your full trade history.</p>
            </div>
          ) : trades.map((trade, i) => {
            const isBuy = /BTO|BUY|BTC|COVER/i.test(trade.trade_type);
            const isClose = /BTC|STC|COVER|SELL/i.test(trade.trade_type);
            const dotColor = i === 0 ? '#3b82f6' : isClose ? '#f87171' : '#10b981';
            const labelText = i === 0 ? 'Current Position' : isClose ? 'Close' : 'Open';
            const tradePL = isClose ? trade.price * trade.quantity : trade.price * trade.quantity;

            return (
              <div key={trade.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: dotColor }}>{labelText}</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{formatDate(trade.trade_date)}</span>
                  </div>
                  {i > 0 && (
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#10b981' }}>
                      +${tradePL.toFixed(2)}
                    </span>
                  )}
                </div>
                {(trade.fees ?? 0) > 0 && (
                  <div style={{ paddingLeft: '1.25rem', fontSize: '0.72rem', color: '#f87171', marginBottom: '0.3rem' }}>
                    ⊖ ${(trade.fees!).toFixed(2)} fees
                  </div>
                )}
                <div style={{ paddingLeft: '1.25rem', marginBottom: trade.notes ? '0.4rem' : 0 }}>
                  <TradeChip trade={trade} />
                </div>
                {trade.notes && (
                  <div style={{ marginLeft: '1.25rem', marginTop: '0.4rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.55rem 0.875rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', display: 'flex', gap: '0.5rem' }}>
                    <span>📄</span>
                    <span>{trade.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Trash2 size={15} /> Delete Position
          </button>
        </div>
      </div>
    </div>
  );
}

// Ticker accordion row — fires the parent's onSelect callback instead of managing own modal
function TickerGroup({ symbol, positions, ytdPL, onSelect }: {
  symbol: string;
  positions: Position[];
  ytdPL: number;
  onSelect: (pos: Position) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Ticker header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.5rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: expanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
      >
        {expanded
          ? <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          : <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
        <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '60px' }}>{symbol}</span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.15rem 0.5rem' }}>{positions.length}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginRight: '0.25rem' }}>YTD P/L:</span>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: ytdPL > 0 ? '#10b981' : ytdPL < 0 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
          {ytdPL >= 0 ? '+' : ''}${ytdPL.toFixed(2)}
        </span>
      </div>

      {/* Expanded position rows */}
      {expanded && positions.map(pos => {
        const trades = pos.trades || [];
        const latestTrade = trades[0];
        const statusColor = STATUS_COLORS[pos.status] || '#6b7280';
        const pl = pos.realized_pl ?? 0;

        return (
          <div
            key={pos.id}
            onClick={(e) => { e.stopPropagation(); onSelect(pos); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.7rem 1.5rem 0.7rem 3.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.15)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.15)')}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', minWidth: '90px' }}>{pos.strategy || 'Option Trade'}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: statusColor, backgroundColor: statusColor + '22', border: `1px solid ${statusColor}44`, borderRadius: '10px', padding: '0.1rem 0.5rem' }}>{pos.status}</span>
            {latestTrade && <TradeChip trade={latestTrade} />}
            <div style={{ flex: 1 }} />
            {pos.status !== 'OPEN' ? (
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Open</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.5rem' }}>—</span>
          </div>
        );
      })}
    </>
  );
}

export default function OptionsClient({ positions }: { positions: Position[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [strategyFilter, setStrategyFilter] = useState('ALL');
  // Modal state at the TOP level — renders above everything
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const allStrategies = useMemo(() => {
    const set = new Set(positions.map(p => p.strategy || 'Option Trade'));
    return Array.from(set).sort();
  }, [positions]);

  const filtered = useMemo(() => positions.filter(p => {
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (strategyFilter !== 'ALL' && (p.strategy || 'Option Trade') !== strategyFilter) return false;
    return true;
  }), [positions, search, statusFilter, strategyFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, Position[]> = {};
    filtered.forEach(p => {
      if (!map[p.symbol]) map[p.symbol] = [];
      map[p.symbol].push(p);
    });
    return map;
  }, [filtered]);

  const totalYtdPL = positions.reduce((s, p) => s + (p.realized_pl ?? 0), 0);

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    padding: '0.55rem 1rem',
    outline: 'none',
  };

  return (
    <>
      {/* MODAL — rendered at top level, outside any overflow:hidden container */}
      {selectedPosition && (
        <PositionModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            placeholder="Search ticker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2.25rem' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, minWidth: '140px' }}>
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="ASSIGNED">Assigned</option>
        </select>
        <select value={strategyFilter} onChange={e => setStrategyFilter(e.target.value)} style={{ ...inputStyle, minWidth: '160px' }}>
          <option value="ALL">All Strategies</option>
          {allStrategies.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grouped Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <BookOpen size={16} />
            Trades by Ticker
          </div>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            YTD P/L:{' '}
            <strong style={{ color: totalYtdPL >= 0 ? '#10b981' : '#f87171' }}>
              {totalYtdPL >= 0 ? '+' : ''}${totalYtdPL.toFixed(2)}
            </strong>
          </span>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
            {positions.length === 0 ? 'No option positions found.' : 'No positions match your filters.'}
          </div>
        ) : (
          Object.entries(grouped).map(([symbol, symbolPositions]) => {
            const ytdPL = symbolPositions.reduce((s, p) => s + (p.realized_pl ?? 0), 0);
            return (
              <TickerGroup
                key={symbol}
                symbol={symbol}
                positions={symbolPositions}
                ytdPL={ytdPL}
                onSelect={setSelectedPosition}
              />
            );
          })
        )}
      </div>
    </>
  );
}
