'use client';
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Eye, EyeOff, X, BookOpen, Trash2, ExternalLink } from 'lucide-react';

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
  const actionColor = isBuy ? '#10b981' : '#f87171';
  const qty = isBuy ? `+${trade.quantity}` : `-${trade.quantity}`;
  const exp = trade.expiration_date ? new Date(trade.expiration_date) : null;
  const expStr = exp ? `${exp.getMonth() + 1}/${exp.getDate()}` : '—';
  const dte = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null;

  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}>
      <span style={{ color: actionColor }}>{qty}</span>
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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{position.symbol}</span>
            <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{position.strategy || 'Option Trade'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ backgroundColor: statusColor, color: '#fff', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>{position.status}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', backgroundColor: 'var(--border-color)' }}>
          {[
            { label: position.status === 'OPEN' ? 'OPEN P/L' : 'NET P/L', value: position.status === 'OPEN' ? 'N/A' : `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`, color: pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'var(--text-primary)' },
            { label: 'AVG TRD PR', value: `$${avgPrice.toFixed(2)}`, color: '#10b981' },
            { label: 'TOTAL FEES', value: `$${fees.toFixed(2)}`, color: '#f87171' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Trade Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trades.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem 0' }}>No trade executions linked to this position yet.</p>
          ) : trades.map((trade, i) => {
            const isBuy = /BTO|BUY|BTC|COVER/i.test(trade.trade_type);
            const isClose = /BTC|STC|COVER|SELL/i.test(trade.trade_type);
            const dotColor = i === 0 ? '#3b82f6' : isClose ? '#f87171' : '#10b981';
            const labelText = i === 0 ? 'Current Position' : isClose ? 'Close' : 'Open';
            const tradePL = isClose ? (trade.price * trade.quantity * (isBuy ? -1 : 1)) : (trade.price * trade.quantity);

            return (
              <div key={trade.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: dotColor }}>{labelText}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(trade.trade_date)}</span>
                  </div>
                  {i > 0 && (
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: tradePL >= 0 ? '#10b981' : '#f87171' }}>
                      {tradePL >= 0 ? '+' : ''}${tradePL.toFixed(2)}
                    </span>
                  )}
                </div>
                {trade.fees != null && trade.fees > 0 && (
                  <div style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#f87171' }}>⊖ ${trade.fees.toFixed(2)} fees</div>
                )}
                <div style={{ paddingLeft: '1.25rem' }}>
                  <TradeChip trade={trade} />
                </div>
                {trade.notes && (
                  <div style={{ marginLeft: '1.25rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.6rem 0.875rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span>📄</span>
                    <span>{trade.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
          <button style={{ flex: 1, padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Trash2 size={16} /> Delete Position
          </button>
        </div>
      </div>
    </div>
  );
}

function TickerGroup({ symbol, positions, ytdPL }: { symbol: string; positions: Position[]; ytdPL: number }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  return (
    <>
      {selectedPosition && <PositionModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />}
      
      {/* Ticker Header Row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', backgroundColor: expanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      >
        {expanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
        <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '60px' }}>{symbol}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.15rem 0.5rem' }}>{positions.length}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>YTD P/L:</span>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: ytdPL > 0 ? '#10b981' : ytdPL < 0 ? '#f87171' : 'var(--text-muted)' }}>
          {ytdPL > 0 ? '+' : ''}${ytdPL.toFixed(2)}
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
            onClick={() => setSelectedPosition(pos)}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem 0.75rem 3.5rem', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.15)' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '90px' }}>{pos.strategy || 'Option Trade'}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', backgroundColor: statusColor + '33', border: `1px solid ${statusColor}55`, borderRadius: '10px', padding: '0.1rem 0.5rem' }}>{pos.status}</span>
            {latestTrade && <TradeChip trade={latestTrade} />}
            <div style={{ flex: 1 }} />
            {pos.status !== 'OPEN' ? (
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'var(--text-muted)' }}>
                {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open</span>
            )}
            <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>—</div>
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
  const [showHidden, setShowHidden] = useState(false);

  // Build strategy list from data
  const allStrategies = useMemo(() => {
    const set = new Set(positions.map(p => p.strategy || 'Option Trade'));
    return Array.from(set).sort();
  }, [positions]);

  // Filter
  const filtered = useMemo(() => {
    return positions.filter(p => {
      if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (strategyFilter !== 'ALL' && (p.strategy || 'Option Trade') !== strategyFilter) return false;
      return true;
    });
  }, [positions, search, statusFilter, strategyFilter]);

  // Group by symbol
  const grouped = useMemo(() => {
    const map: Record<string, Position[]> = {};
    filtered.forEach(p => {
      if (!map[p.symbol]) map[p.symbol] = [];
      map[p.symbol].push(p);
    });
    return map;
  }, [filtered]);

  const totalYtdPL = positions.reduce((s, p) => s + (p.realized_pl ?? 0), 0);
  const inputStyle = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', padding: '0.6rem 1rem', outline: 'none' };

  return (
    <>
      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search ticker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2rem' }}
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

        <button
          onClick={() => setShowHidden(h => !h)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {showHidden ? 'Hide Closed' : 'Show All'}
        </button>
      </div>

      {/* Grouped Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <BookOpen size={16} />
            Trades by Ticker
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            YTD P/L: <strong style={{ color: totalYtdPL >= 0 ? '#10b981' : '#f87171' }}>{totalYtdPL >= 0 ? '+' : ''}${totalYtdPL.toFixed(2)}</strong>
          </span>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {positions.length === 0
              ? 'No option positions found. Run Sync & Import from the Brokerage page.'
              : 'No positions match your filters.'}
          </div>
        ) : (
          Object.entries(grouped).map(([symbol, symbolPositions]) => {
            const ytdPL = symbolPositions.reduce((s, p) => s + (p.realized_pl ?? 0), 0);
            return <TickerGroup key={symbol} symbol={symbol} positions={symbolPositions} ytdPL={ytdPL} />;
          })
        )}
      </div>
    </>
  );
}
