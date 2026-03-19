import { Info } from 'lucide-react';
import TradeModal from '@/components/TradeModal';
import { createClient } from '@/utils/supabase/server';
import { Position, Trade } from '@/lib/types';

export default async function OptionsPage() {
  const supabase = await createClient();
  const { data: positions } = await supabase.from('positions').select('*').eq('asset_type', 'OPTION').order('created_at', { ascending: false });

  const firstPosition = positions?.[0];
  let firstPositionTrades: Trade[] = [];
  if (firstPosition) {
    const { data } = await supabase.from('trades').select('*').eq('position_id', firstPosition.id).order('trade_date', { ascending: false });
    firstPositionTrades = data || [];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Options Positions</h1>
        <p className="text-muted">View your active and closed options strategies and aggregated P/L.</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Symbol</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Strategy</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realized P/L</th>
            </tr>
          </thead>
          <tbody>
            {positions && positions.length > 0 ? positions.map((pos: Position) => (
              <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{pos.symbol}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{pos.strategy}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                   <span className={`badge ${pos.status === 'OPEN' ? 'badge-primary' : pos.status === 'CLOSED' ? 'badge-dark' : 'badge-purple'}`}>{pos.status}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: pos.realized_pl >= 0 ? 'var(--accent-success)' : 'var(--text-primary)', fontWeight: 600 }}>
                   {pos.realized_pl >= 0 ? '+' : '-'}${Math.abs(pos.realized_pl).toFixed(2)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No options positions derived. Click &quot;Log New Trade&quot; on the Dashboard.
                </td>
              </tr>
            )}
            
            {/* The static AAPL demo rows for presentation */}
            <tr style={{ borderTop: '4px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <td colSpan={5} style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Demo Examples Below</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>AAPL</td>
              <td style={{ padding: '1rem 1.5rem' }}>Covered Call</td>
              <td style={{ padding: '1rem 1.5rem' }}><span className="badge badge-purple">ASSIGNED</span></td>
              <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-success)', fontWeight: 600 }}>+$195.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
        <Info size={16} />
        <span>Your real auto-aggregated positions from Supabase stream sequentially above. The Trade Modal below visualizes the lifecycle of your most recent logged Position.</span>
      </div>

      <div style={{ padding: '2rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '16px', display: 'flex', justifyContent: 'center' }}>
         <TradeModal position={firstPosition} trades={firstPositionTrades} />
      </div>
    </div>
  );
}
