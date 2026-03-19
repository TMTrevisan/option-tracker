import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: openOptions } = await supabase
    .from('positions')
    .select('symbol, strike_price, expiration_date, option_type, open_quantity, closed_quantity, side')
    .eq('asset_type', 'OPTION')
    .eq('status', 'OPEN');

  console.log("CURRENTLY OPEN IN DB:", JSON.stringify(openOptions, null, 2));
}
run();
