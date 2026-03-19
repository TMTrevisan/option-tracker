import { createClient } from '@supabase/supabase-js';
import { linkTradeToPosition } from './src/lib/services/positions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: openOptions } = await supabase
    .from('positions')
    .select('*')
    .eq('asset_type', 'OPTION')
    .eq('status', 'OPEN');

  const todayStr = '2026-03-19';
  console.log(`Found ${openOptions?.length} open options.`);
  let expiredCount = 0;

  for (const pos of openOptions || []) {
    if (pos.expiration_date && pos.expiration_date < todayStr) {
      console.log(`Expired: ${pos.symbol} ${pos.strike_price} ${pos.option_type} exp: ${pos.expiration_date}`);
      
      const qtyToClose = (pos.open_quantity || 0) - (pos.closed_quantity || 0);
      if (qtyToClose <= 0) continue;

      const isLong = pos.side === 'LONG';
      const closeAction = isLong ? 'STC' : 'BTC';

      const synthTrade = {
          user_id: pos.user_id,
          trade_type: closeAction,
          symbol: pos.symbol,
          quantity: qtyToClose,
          price: 0, 
          fees: 0,
          trade_date: pos.expiration_date + 'T20:00:00Z', 
          notes: 'Auto-Expired Worthless by Sync Engine',
          tags: ['#expired'],
          strike_price: pos.strike_price,
          expiration_date: pos.expiration_date,
          option_type: pos.option_type,
      };

      const positionId = await linkTradeToPosition(supabase, synthTrade as any);
      if (positionId) {
          (synthTrade as any).position_id = positionId;
          const { error } = await supabase.from('trades').insert(synthTrade as any);
          if (error) console.error("Error inserting trade:", error);
          expiredCount++;
      } else {
          console.log("Failed to link synth trade for", pos.symbol);
      }
    }
  }
  console.log(`Successfully closed ${expiredCount} expired option positions.`);
}
run();
