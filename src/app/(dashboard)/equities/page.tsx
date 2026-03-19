import { Info } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { Position } from '@/lib/types';

export default async function EquitiesPage() {
  const supabase = await createClient();
  const { data: positions } = await supabase.from('positions').select('*').eq('asset_type', 'EQUITY').order('created_at', { ascending: false });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Equities Positions</h1>
        <p className="text-muted">Track your stock positions and adjusted cost basis accumulated directly from RollTrackr.</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Symbol</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Adj Cost Basis</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realized P/L</th>
            </tr>
          </thead>
          <tbody>
            {positions && positions.length > 0 ? positions.map((pos: Position) => (
              <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{pos.symbol}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>${pos.adjusted_cost_basis.toFixed(2)}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                   <span className={`badge ${pos.status === 'OPEN' ? 'badge-primary' : pos.status === 'CLOSED' ? 'badge-dark' : 'badge-purple'}`}>{pos.status}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: pos.realized_pl >= 0 ? 'var(--accent-success)' : 'var(--text-primary)', fontWeight: 600 }}>
                   {pos.realized_pl >= 0 ? '+' : '-'}${Math.abs(pos.realized_pl).toFixed(2)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No equity positions aggregated. Click &quot;Log New Trade&quot; on the Dashboard.
                </td>
              </tr>
            )}
            
            <tr style={{ borderTop: '4px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <td colSpan={4} style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Demo Aggregated Examples Below</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>AAPL</td>
              <td style={{ padding: '1rem 1.5rem' }}>$190.00 <span className="text-success text-xs block">Adj: $185.50</span></td>
              <td style={{ padding: '1rem 1.5rem' }}><span className="badge badge-primary">OPEN</span></td>
              <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>--</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
        <Info size={16} />
        <span>Your real Auto-Aggregated positions stream sequentially above.</span>
      </div>
    </div>
  );
}
