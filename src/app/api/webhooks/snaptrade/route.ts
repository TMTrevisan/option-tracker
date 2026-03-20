import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { linkTradeToPosition } from '@/lib/services/positions';
import { Database, BrokerageAccount } from '@/lib/types';
import crypto from 'crypto';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Requires service role to bypass RLS for server-to-server execution payload ingestion
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey || 'mock-key');

// Zod schema for validating the SnapTrade execution payload
const SnapTradeExecutionSchema = z.object({
  account_id: z.string(),
  action: z.enum(['BUY', 'SELL', 'BTO', 'STC', 'STO', 'BTC', 'ASSIGNMENT', 'EXERCISE']),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  commissions: z.number().nonnegative().optional(),
  timestamp: z.string(),
  symbol: z.object({
    ticker: z.string(),
  }),
  option_symbol: z.object({
    strike: z.number(),
    expiration: z.string(),
    type: z.enum(['CALL', 'PUT', 'call', 'put']),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('SnapTrade-Signature');
    const webhookSecret = process.env.SNAPTRADE_WEBHOOK_SECRET;

    // 1. Verify cryptographic HMAC signature
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64');
      if (hmac !== signature) {
        return NextResponse.json({ error: 'Invalid signature guarantee' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // 2. We only care about execution events
    if (payload.event_type !== 'TRADE_EXECUTED') {
       return NextResponse.json({ received: true });
    }

    // 3. Validate payload with Zod
    const parsedData = SnapTradeExecutionSchema.safeParse(payload.data);
    if (!parsedData.success) {
      console.error('Zod Validation Failed:', parsedData.error.flatten());
      return NextResponse.json({ error: 'Malformed execution payload', details: parsedData.error.flatten() }, { status: 400 });
    }
    const execution = parsedData.data;
    
    // 4. Find User via Brokerage Account mapping
    const { data } = await supabase
      .from('brokerage_accounts')
      .select('*')
      .eq('id', execution.account_id)
      .single();

    const account = data as unknown as BrokerageAccount;

    if (!account) {
      return NextResponse.json({ error: 'Account linkage detached' }, { status: 404 });
    }

    // 5. Transform SnapTrade execution format to our TradeInsert schema
    const tradeData: Database['public']['Tables']['trades']['Insert'] = {
      user_id: account.user_id,
      account_id: execution.account_id,
      trade_type: execution.action as Database['public']['Tables']['trades']['Insert']['trade_type'],
      symbol: execution.symbol.ticker,
      quantity: execution.quantity,
      price: execution.price,
      fees: execution.commissions || 0,
      trade_date: new Date(execution.timestamp).toISOString(),
      notes: 'Auto-ingested from SnapTrade Webhook',
      tags: ['#auto-ingest']
    };

    // Parse derivative legs
    if (execution.option_symbol) {
       tradeData.strike_price = execution.option_symbol.strike;
       tradeData.expiration_date = typeof execution.option_symbol.expiration === 'string' 
          ? execution.option_symbol.expiration.split('T')[0] 
          : execution.option_symbol.expiration;
       tradeData.option_type = execution.option_symbol.type.toUpperCase() as 'CALL' | 'PUT'; 
    }

    // 6. Fire Roll Aggregation Engine natively context rules
    const positionId = await linkTradeToPosition(supabase, tradeData);
    if (positionId) {
       tradeData.position_id = positionId;
    }

    // 7. Complete Data Insertion
    // @ts-ignore - Bypass generic overload infer failure mapping
    const { error } = await supabase.from('trades').insert(tradeData as any);
    if (error) throw error;

    return NextResponse.json({ success: true, position_id: positionId });

  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
