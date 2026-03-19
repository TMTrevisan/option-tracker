import { createClient } from '@/utils/supabase/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';

// Returns live positions with market prices from the connected brokerages (Robinhood etc)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();
  const secret = user.user_metadata?.snaptrade_secret;

  if (!clientId || !consumerKey || !secret) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const snaptrade = new Snaptrade({ clientId, consumerKey });

    const accountsRes = await snaptrade.accountInformation.listUserAccounts({
      userId: user.id,
      userSecret: secret,
    });
    const accounts = accountsRes.data || [];

    // Fetch live positions from all accounts concurrently
    const positionFetches = accounts.map((account: any) =>
      snaptrade.accountInformation.getUserAccountPositions({
        userId: user.id,
        userSecret: secret,
        accountId: account.id,
      }).catch(() => null)
    );

    const results = await Promise.all(positionFetches);

    // Build a map of symbol → { currentPrice, marketValue, change }
    const prices: Record<string, { price: number; market_value: number; daily_change?: number; daily_change_pct?: number }> = {};

    for (const res of results) {
      if (!res) continue;
      const positions = res.data as any;
      const posArr = Array.isArray(positions) ? positions
        : Array.isArray(positions?.positions) ? positions.positions
        : [];

      for (const pos of posArr) {
        const symbol = pos.symbol?.symbol || pos.symbol?.ticker || pos.symbol?.raw_symbol;
        if (!symbol) continue;
        prices[symbol] = {
          price: pos.price ?? pos.current_price ?? 0,
          market_value: pos.market_value ?? 0,
          daily_change: pos.day_gain ?? pos.today_change ?? undefined,
          daily_change_pct: pos.day_gain_pct ?? pos.today_change_pct ?? undefined,
        };
      }
    }

    return NextResponse.json({ prices });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, prices: {} }, { status: 500 });
  }
}
