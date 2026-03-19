import { createClient } from '@/utils/supabase/server';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: positions }, { data: trades }] = await Promise.all([
    supabase.from('positions').select('*').eq('user_id', user?.id),
    supabase.from('trades').select('*').eq('user_id', user?.id),
  ]);

  const allPositions = positions || [];
  const allTrades = trades || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted">Deep-dive into your trading performance.</p>
      </div>
      <AnalyticsClient positions={allPositions} trades={allTrades} />
    </div>
  );
}
