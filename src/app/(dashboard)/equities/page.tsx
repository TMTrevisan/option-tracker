import { createClient } from '@/utils/supabase/server';
import EquitiesClient from './EquitiesClient';
import Link from 'next/link';

export default async function EquitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: positions } = await supabase
    .from('positions')
    .select('*, trades(*)')
    .eq('asset_type', 'EQUITY')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const enriched = (positions || []).map((p: any) => ({
    ...p,
    trades: (p.trades || []).sort((a: any, b: any) =>
      new Date(b.trade_date || 0).getTime() - new Date(a.trade_date || 0).getTime()
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Equity Positions</h1>
          <p className="text-muted">Track your stock holdings and adjusted cost basis.</p>
        </div>
        <Link href="/log-trade" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none' }}>
          + Log New Trade
        </Link>
      </div>
      <EquitiesClient positions={enriched} />
    </div>
  );
}
