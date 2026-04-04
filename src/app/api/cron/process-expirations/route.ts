import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, Position, Trade } from '@/lib/types';
import { linkTradeToPosition } from '@/lib/services/positions';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock'
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
    }

    // 1. Fetch recently expired OPEN options positions
    // In a real application, we'd do an exact date comparison. 
    // Here we query ALL OPEN options and filter dynamically.
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('asset_type', 'OPTION')
      .eq('status', 'OPEN');

    const openOptions = data as unknown as Position[];
    if (!openOptions) return NextResponse.json({ processed: 0 });

    let processedCount = 0;
    const today = new Date();

    for (const pos of openOptions) {
       // Query the atomic opening trade to find the expiration date
       const { data } = await supabase
         .from('trades')
         .select('*')
         .eq('position_id', pos.id)
         .limit(1);

       const trades = data as unknown as Trade[];

       if (trades && trades.length > 0 && trades[0].expiration_date) {
          const expDate = new Date(trades[0].expiration_date);
          
          if (expDate < today) {
             const isShort = pos.side === 'SHORT';
             const synthTrade: Database['public']['Tables']['trades']['Insert'] = {
                user_id: pos.user_id,
                position_id: pos.id,
                trade_type: isShort ? 'BTC' : 'STC',
                symbol: pos.symbol,
                quantity: pos.open_quantity || 1,
                price: 0,
                fees: 0,
                trade_date: today.toISOString(),
                notes: 'Auto-Expired Worthless by System CRON',
                tags: ['#expired']
             };

             await linkTradeToPosition(supabase, synthTrade);
             // @ts-ignore
             await supabase.from('trades').insert(synthTrade as any);
             processedCount++;
          }
       }
    }

    return NextResponse.json({ processed: processedCount, success: true });
  } catch(e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
