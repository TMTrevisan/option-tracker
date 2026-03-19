import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: trades } = await supabase.from('trades').select('trade_date, trade_type, quantity, symbol, strike_price, expiration_date, option_type').eq('symbol', 'INTC').order('trade_date', { ascending: true });
  console.log("INTC TRADES:", JSON.stringify(trades, null, 2));
}
run();
