import { createClient } from '@/utils/supabase/server';
import { Position } from '@/lib/types';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default async function EquitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('asset_type', 'EQUITY')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const equities = (positions || []) as Position[];

  const totalRealizedPL = equities.reduce((sum, p) => sum + (p.realized_pl || 0), 0);
  const openCount = equities.filter(p => p.status === 'OPEN').length;
  const closedCount = equities.filter(p => p.status === 'CLOSED').length;
  const totalCostBasis = equities.filter(p => p.status === 'OPEN').reduce((sum, p) => sum + (p.adjusted_cost_basis || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Equity Positions</h1>
          <p className="text-muted">Track your stock holdings and adjusted cost basis.</p>
        </div>
        <Link href="/log-trade" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none' }}>
          + Log New Trade
        </Link>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Positions" value={equities.length.toString()} sub={`${openCount} open · ${closedCount} closed`} />
        <StatCard label="Open Cost Basis" value={`$${totalCostBasis.toFixed(2)}`} sub="Sum of open positions" />
        <StatCard label="Realized P/L" value={`${totalRealizedPL >= 0 ? '+' : ''}$${totalRealizedPL.toFixed(2)}`} sub="Closed positions only" positive={totalRealizedPL >= 0} />
        <StatCard label="Open Positions" value={openCount.toString()} sub="Currently active" />
      </div>

      {/* Positions Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>All Equity Positions</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{equities.length} total</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Symbol</th>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Strategy</th>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Open Qty</th>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cost Basis</th>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.875rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realized P/L</th>
            </tr>
          </thead>
          <tbody>
            {equities.length > 0 ? equities.map((pos: Position) => (
              <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{pos.symbol}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{pos.strategy || 'Long Stock'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{pos.open_quantity ?? '—'}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                  {pos.adjusted_cost_basis != null ? `$${Number(pos.adjusted_cost_basis).toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span className={`badge ${pos.status === 'OPEN' ? 'badge-primary' : pos.status === 'CLOSED' ? 'badge-dark' : 'badge-purple'}`}>
                    {pos.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: (pos.realized_pl ?? 0) > 0 ? 'var(--accent-success)' : (pos.realized_pl ?? 0) < 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {pos.status === 'OPEN' ? <span style={{ color: 'var(--text-muted)' }}>Open</span> : `${(pos.realized_pl ?? 0) >= 0 ? '+' : ''}$${Math.abs(pos.realized_pl ?? 0).toFixed(2)}`}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No equity positions yet. Run <strong>Sync &amp; Import</strong> from the Brokerage page, or <Link href="/log-trade" style={{ color: 'var(--accent-primary)' }}>log a trade manually</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
