import { createClient } from '@/utils/supabase/server';
import OptionsClient from './OptionsClient';

export default async function OptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all option positions with their linked trades
  const { data: positions } = await supabase
    .from('positions')
    .select('*, trades(*)')
    .eq('asset_type', 'OPTION')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Sort each position's trades by trade_date descending
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
          <h1 className="text-3xl font-bold mb-2">Option Trades</h1>
          <p className="text-muted">Complete trading history</p>
        </div>
      </div>

      <OptionsClient positions={enriched} />
    </div>
  );
}
