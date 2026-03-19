import { createClient } from '@/utils/supabase/server';
import { Position } from '@/lib/types';
import Link from 'next/link';

export default async function OptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: positions } = await supabase
    .from('positions')
    .select('*, trades(*)')
    .eq('asset_type', 'OPTION')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const options = (positions || []) as any[];

  const totalRealizedPL = options.reduce((sum, p) => sum + (p.realized_pl || 0), 0);
  const openCount = options.filter(p => p.status === 'OPEN').length;
  const closedCount = options.filter(p => p.status === 'CLOSED').length;
  const winCount = options.filter(p => p.status === 'CLOSED' && (p.realized_pl || 0) > 0).length;
  const winRate = closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0;

  // Group by symbol
  const bySymbol: Record<string, any[]> = {};
  options.forEach(p => {
    if (!bySymbol[p.symbol]) bySymbol[p.symbol] = [];
    bySymbol[p.symbol].push(p);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Option Positions</h1>
          <p className="text-muted">Complete options trading history grouped by underlying.</p>
        </div>
        <Link href="/log-trade" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none' }}>
          + Log New Trade
        </Link>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Positions" value={options.length.toString()} sub={`${openCount} open · ${closedCount} closed`} />
        <StatCard label="Realized P/L" value={`${totalRealizedPL >= 0 ? '+' : ''}$${totalRealizedPL.toFixed(2)}`} sub="All closed positions" positive={totalRealizedPL > 0 ? true : totalRealizedPL < 0 ? false : undefined} />
        <StatCard label="Win Rate" value={`${winRate}%`} sub={`${winCount} of ${closedCount} closed`} positive={winRate >= 50 ? true : winRate > 0 ? false : undefined} />
        <StatCard label="Open Positions" value={openCount.toString()} sub="Currently active" />
      </div>

      {/* Grouped positions table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Trades by Ticker</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            YTD P/L: <strong style={{ color: totalRealizedPL >= 0 ? 'var(--accent-success)' : '#f87171' }}>{totalRealizedPL >= 0 ? '+' : ''}${totalRealizedPL.toFixed(2)}</strong>
          </span>
        </div>

        {options.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No options positions found. Run <strong>Sync &amp; Import</strong> from the Brokerage page, or <Link href="/log-trade" style={{ color: 'var(--accent-primary)' }}>log a trade manually</Link>.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Symbol</th>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Strategy</th>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realized P/L</th>
              </tr>
            </thead>
            <tbody>
              {options.map((pos: any) => (
                <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{pos.symbol}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{pos.strategy || 'Option Trade'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {pos.trades?.[0]?.option_type ? (
                      <span className={`badge ${pos.trades[0].option_type === 'CALL' ? 'badge-primary' : 'badge-purple'}`}>
                        {pos.trades[0].option_type}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>{pos.open_quantity ?? '—'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${pos.status === 'OPEN' ? 'badge-primary' : pos.status === 'CLOSED' ? 'badge-dark' : 'badge-purple'}`}>
                      {pos.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: (pos.realized_pl ?? 0) > 0 ? 'var(--accent-success)' : (pos.realized_pl ?? 0) < 0 ? '#f87171' : 'var(--text-muted)' }}>
                    {pos.status === 'OPEN' ? <span style={{ color: 'var(--text-muted)' }}>Open</span> : `${(pos.realized_pl ?? 0) >= 0 ? '+' : ''}$${Math.abs(pos.realized_pl ?? 0).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: positive === true ? 'var(--accent-success)' : positive === false ? '#f87171' : 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>
    </div>
  );
}
