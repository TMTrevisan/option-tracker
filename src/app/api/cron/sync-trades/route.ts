import { createClient } from '@supabase/supabase-js';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';
import { linkTradeToPosition } from '@/lib/services/positions';

// Auth guard — Vercel sends CRON_SECRET in Authorization header
function authorized(req: Request) {
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// Strategy helper (same as in sync/route.ts)
function classifyStrategy(tradeType: string, optionType: string | null): string {
  const tt = tradeType.toUpperCase();
  const ot = (optionType || '').toUpperCase();
  if (ot === 'CALL' && tt === 'BUY') return 'Long Call';
  if (ot === 'CALL' && tt === 'SELL') return 'Covered Call';
  if (ot === 'PUT' && tt === 'SELL') return 'Short Put';
  if (ot === 'PUT' && tt === 'BUY') return 'Long Put';
  if (tt === 'BUY') return 'Long Stock';
  if (tt === 'SELL') return 'Short Stock';
  return 'Option Trade';
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();
  if (!clientId || !consumerKey) {
    return NextResponse.json({ error: 'Missing SnapTrade config' }, { status: 500 });
  }

  // Fetch all users who have a snaptrade_secret in their metadata
  const { data: users } = await supabase.auth.admin.listUsers();
  const eligibleUsers = (users?.users || []).filter(
    (u: any) => u.user_metadata?.snaptrade_secret
  );

  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const user of eligibleUsers) {
    try {
      const secret = user.user_metadata.snaptrade_secret;
      const snaptrade = new Snaptrade({ clientId, consumerKey });

      // Use yesterday's date as the rolling sync window (last 2 days for buffer)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const startDateStr = startDate.toISOString().slice(0, 10);

      const accountsRes = await snaptrade.accountInformation.listUserAccounts({
        userId: user.id,
        userSecret: secret,
      });
      const accounts = accountsRes.data || [];

      const fetchPromises = accounts.map((account: any) =>
        snaptrade.accountInformation.getAccountActivities({
          userId: user.id,
          userSecret: secret,
          accountId: account.id,
          startDate: startDateStr,
        }).then((res: any) => ({ res, account })).catch(() => null)
      );

      const responses = await Promise.all(fetchPromises);

      for (const result of responses) {
        if (!result) continue;
        const { res: activitiesResponse, account } = result;

        let rawActivities = activitiesResponse.data as any;
        if (rawActivities?.activities) rawActivities = rawActivities.activities;
        else if (rawActivities?.data) rawActivities = rawActivities.data;
        if (!Array.isArray(rawActivities)) continue;

        const validTrades = rawActivities.filter((a: any) => /BUY|SELL/i.test(a.type || ''));

        for (const trade of validTrades) {
          const isBuy = /BUY/i.test(trade.type);
          const tt = isBuy ? 'BUY' : 'SELL';
          const qty = trade.units ? Math.abs(trade.units) : 0;
          const baseSymbol = trade.symbol?.symbol || trade.symbol?.raw_symbol || 'UNKNOWN';

          let strike_price = null, expiration_date = null, option_type = null;
          if (trade.option_symbol) {
            if (typeof trade.option_symbol === 'object') {
              strike_price = trade.option_symbol.strike_price || trade.option_symbol.strike;
              expiration_date = trade.option_symbol.expiration_date || trade.option_symbol.expiration;
              option_type = (trade.option_symbol.option_type || '').startsWith('c') ? 'CALL' : 'PUT';
            }
          }

          const tradeInsert: any = {
            user_id: user.id,
            trade_type: tt,
            symbol: baseSymbol,
            quantity: qty,
            price: trade.price || 0,
            fees: trade.fee || 0,
            trade_date: trade.trade_date || new Date().toISOString(),
            brokerage_trade_id: trade.id,
            account_id: account.id,
            notes: 'Auto-Synced by Nightly Cron',
            tags: ['#cron-sync'],
          };
          if (strike_price) tradeInsert.strike_price = strike_price;
          if (expiration_date) tradeInsert.expiration_date = expiration_date;
          if (option_type) tradeInsert.option_type = option_type;

          const strategy = classifyStrategy(tt, option_type);
          const positionId = await linkTradeToPosition(supabase, tradeInsert, strategy);
          if (positionId) tradeInsert.position_id = positionId;

          const { error } = await supabase.from('trades').insert(tradeInsert).select('id').single();
          if (!error) {
            totalInserted++;
          } else if (error.code === '23505') {
            // Backfill position_id on duplicate
            if (positionId) {
              await supabase.from('trades')
                .update({ position_id: positionId })
                .eq('brokerage_trade_id', trade.id)
                .is('position_id', null);
            }
            totalSkipped++;
          }
        }
      }
    } catch (e: any) {
      errors.push(`User ${user.id}: ${e.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    usersProcessed: eligibleUsers.length,
    inserted: totalInserted,
    skipped: totalSkipped,
    errors,
    timestamp: new Date().toISOString(),
  });
}
