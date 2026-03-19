'use client';
import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search, X, BookOpen, Trash2, Zap } from 'lucide-react';
import DateRangeFilter, { DateRange, inDateRange } from '@/components/DateRangeFilter';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import { calculateGreeks, getDTE } from '@/lib/utils/greeks';
import CSVExportButton from '@/components/CSVExportButton';

type LiveQuote = {
  price?: number;
  open_pl?: number;
  open_pl_pct?: number;
  option_mark?: number;
  option_avg_cost?: number;
  option_units?: number;
  option_open_pl?: number;
  iv?: number;
  underlying_price?: number;
  open_interest?: number;
};

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
  account_id?: string;
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

function PositionModal({ position, onClose, livePrices }: { position: Position; onClose: () => void; livePrices: Record<string, LiveQuote> }) {
  const trades = position.trades || [];
  const pl = position.realized_pl ?? 0;
  const fees = position.total_fees ?? 0;
  const avgPrice = trades.length > 0 ? trades.reduce((s, t) => s + t.price, 0) / trades.length : 0;
  const statusColor = STATUS_COLORS[position.status] || '#6b7280';
  const live = livePrices[position.symbol];
  const openPL = live?.option_open_pl ?? live?.open_pl;
  const mark = live?.option_mark ?? live?.price;
  const iv = live?.iv;
  const underlying = live?.underlying_price;
  const underPrice = underlying ?? 0;
  const ivValue = iv ?? 0;
  
  // Find strike and expiration from trades to calculate Greeks
  const optionTrade = trades.find(t => t.strike_price && t.expiration_date);
  const strike = optionTrade?.strike_price ?? 0;
  const expiration = optionTrade?.expiration_date ?? '';
  const optionType = (optionTrade?.option_type || 'CALL').toUpperCase() as 'CALL' | 'PUT';
  
  const greeks = useMemo(() => {
    if (!underPrice || !strike || !expiration || !ivValue) return null;
    const dte = getDTE(expiration);
    return calculateGreeks(underPrice, strike, dte / 365, ivValue, 0.05, optionType);
  }, [underPrice, strike, expiration, ivValue, optionType]);

  const { toast } = useToast();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/positions/${position.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast(`Position ${position.symbol} deleted.`, 'success');
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error || 'Failed to delete position.', 'error');
      }
    } catch {
      toast('Network error — could not delete position.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

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
            { label: position.status === 'OPEN' ? 'OPEN P/L' : 'NET P/L',
              value: position.status === 'OPEN'
                ? (openPL != null ? `${openPL >= 0 ? '+' : ''}$${openPL.toFixed(2)}` : 'Live…')
                : `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`,
              color: position.status === 'OPEN'
                ? (openPL != null ? (openPL > 0 ? '#10b981' : openPL < 0 ? '#f87171' : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.3)')
                : (pl > 0 ? '#10b981' : pl < 0 ? '#f87171' : 'rgba(255,255,255,0.7)') },
            { label: 'MARK / AVG', value: mark != null ? `$${mark.toFixed(2)} / $${avgPrice.toFixed(2)}` : `$${avgPrice.toFixed(2)}`, color: '#10b981' },
            { label: 'FEES', value: `$${fees.toFixed(2)}`, color: '#f87171' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '1rem 1.25rem', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Live Market Data Row — only shown if data available */}
        {(mark != null || iv != null || underlying != null) && (
          <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(16,185,129,0.05)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
              {mark != null && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Mark <strong style={{ color: '#fff' }}>${mark.toFixed(2)}</strong></span>}
              {underPrice > 0 && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Underlying <strong style={{ color: '#fff' }}>${underPrice.toFixed(2)}</strong></span>}
              {ivValue > 0 && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>IV <strong style={{ color: '#f59e0b' }}>{(ivValue * 100).toFixed(1)}%</strong></span>}
            </div>
            {greeks && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', padding: '0.4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Δ <strong style={{ color: '#fff' }}>{greeks.delta.toFixed(3)}</strong></span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Γ <strong style={{ color: '#fff' }}>{greeks.gamma.toFixed(4)}</strong></span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Θ <strong style={{ color: '#f87171' }}>{greeks.theta.toFixed(3)}</strong></span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>ν <strong style={{ color: '#60a5fa' }}>{greeks.vega.toFixed(3)}</strong></span>
              </div>
            )}
          </div>
        )}
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
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '0.65rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 2, padding: '0.65rem', backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#f87171', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {deleting ? 'Deleting...' : '⚠️ Confirm Delete'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Trash2 size={15} /> Delete Position
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Ticker accordion row — fires the parent's onSelect callback instead of managing own modal
function TickerGroup({ symbol, positions, ytdPL, onSelect, livePrices }: {
  symbol: string;
  positions: Position[];
  ytdPL: number;
  onSelect: (pos: Position) => void;
  livePrices: Record<string, LiveQuote>;
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
            ) : (() => {
              const lq = livePrices?.[pos.symbol];
              const openPL = lq?.option_open_pl ?? lq?.open_pl;
              if (openPL != null) return (
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: openPL > 0 ? '#10b981' : openPL < 0 ? '#f87171' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Zap size={10} />{openPL >= 0 ? '+' : ''}${openPL.toFixed(2)}
                </span>
              );
              return <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Live…</span>;
            })()
            }
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.5rem' }}>—</span>
          </div>
        );
      })}
    </>
  );
}

export default function OptionsClient({ positions, accounts = [] }: { positions: Position[]; accounts?: string[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [strategyFilter, setStrategyFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'symbol' | 'pl' | 'status' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [livePrices, setLivePrices] = useState<Record<string, LiveQuote>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => { if (d.prices) setLivePrices(d.prices); })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, []);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const allStrategies = useMemo(() => {
    const set = new Set(positions.map(p => p.strategy || 'Option Trade'));
    return Array.from(set).sort();
  }, [positions]);

  const filtered = useMemo(() => {
    let arr = positions.filter(p => {
      if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (strategyFilter !== 'ALL' && (p.strategy || 'Option Trade') !== strategyFilter) return false;
      if (accountFilter !== 'ALL') {
        const hasAccount = (p.trades || []).some(t => t.account_id === accountFilter);
        if (!hasAccount) return false;
      }
      // Date filter — match if any trade falls in range, or fall back to position created_at
      if (dateRange.from || dateRange.to) {
        const tradeDates = (p.trades || []).map(t => t.trade_date).filter(Boolean);
        const hasDateMatch = tradeDates.length > 0
          ? tradeDates.some(d => inDateRange(d, dateRange))
          : inDateRange(p.created_at, dateRange);
        if (!hasDateMatch) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'symbol') { va = a.symbol; vb = b.symbol; }
      else if (sortKey === 'pl') { va = a.realized_pl ?? 0; vb = b.realized_pl ?? 0; }
      else if (sortKey === 'status') { va = a.status; vb = b.status; }
      else { va = a.created_at || ''; vb = b.created_at || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [positions, search, statusFilter, strategyFilter, accountFilter, dateRange, sortKey, sortDir]);

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

  const SortChip = ({ label, k }: { label: string; k: typeof sortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: sortKey === k ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)', backgroundColor: sortKey === k ? 'rgba(96,165,250,0.12)' : 'transparent', color: sortKey === k ? '#60a5fa' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
    >
      {label}
      {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <>
      {/* MODAL — rendered at top level, outside any overflow:hidden container */}
      {selectedPosition && (
        <PositionModal position={selectedPosition} onClose={() => setSelectedPosition(null)} livePrices={livePrices} />
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
        {accounts.length > 1 && (
          <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ ...inputStyle, minWidth: '160px' }}>
            <option value="ALL">All Accounts</option>
            {accounts.map(a => (
              <option key={a} value={a}>{a.length > 20 ? `...${a.slice(-12)}` : a}</option>
            ))}
          </select>
        )}
        <DateRangeFilter onChange={setDateRange} />
        <CSVExportButton data={filtered} filename={`options_positions_${new Date().toISOString().split('T')[0]}`} />

        {/* Sort chips */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginRight: '0.25rem' }}>SORT</span>
          <SortChip label="Date" k="date" />
          <SortChip label="P/L" k="pl" />
          <SortChip label="Symbol" k="symbol" />
          <SortChip label="Status" k="status" />
        </div>
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
                livePrices={livePrices}
              />
            );
          })
        )}
      </div>
    </>
  );
}
