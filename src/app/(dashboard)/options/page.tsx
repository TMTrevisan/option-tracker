import { createClient } from '@/utils/supabase/server';
import OptionsClient from './OptionsClient';

export default async function OptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [positionsResult, accountsResult] = await Promise.all([
    supabase
      .from('positions')
      .select('*, trades(*)')
      .eq('asset_type', 'OPTION')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false }),
    // Distinct account_ids from trades for the filter dropdown
    supabase
      .from('trades')
      .select('account_id')
      .eq('user_id', user?.id)
      .not('account_id', 'is', null),
  ]);

  const enriched = (positionsResult.data || []).map((p: any) => ({
    ...p,
    trades: (p.trades || []).sort((a: any, b: any) =>
      new Date(b.trade_date || 0).getTime() - new Date(a.trade_date || 0).getTime()
    ),
  }));

  // Build unique account list for the filter
  const allAccountIds = Array.from(
    new Set((accountsResult.data || []).map((t: any) => t.account_id).filter(Boolean))
  ) as string[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Option Trades</h1>
          <p className="text-muted">Complete trading history</p>
        </div>
      </div>

      <OptionsClient positions={enriched} accounts={allAccountIds} />
    </div>
  );
}
