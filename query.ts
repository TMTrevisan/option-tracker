import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: pos } = await supabase.from('positions').select('*').eq('symbol', 'EPD').eq('status', 'OPEN');
  console.log("OPEN EPD POSITIONS:", JSON.stringify(pos, null, 2));

  if (pos && pos.length > 0) {
    const { data: trades } = await supabase.from('trades').select('*').eq('symbol', 'EPD').order('trade_date', { ascending: true });
    console.log("EPD TRADES:", JSON.stringify(trades, null, 2));
  }
}
run();
