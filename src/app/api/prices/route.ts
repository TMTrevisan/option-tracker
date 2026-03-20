import { createClient } from '@/utils/supabase/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

/**
 * GET /api/prices
 * Returns a unified map of symbol → live market data from Robinhood via SnapTrade.
 *
 * Available from SnapTrade OptionsPosition:
 *   price (mark), units, average_purchase_price
 * Available from SnapTrade OptionQuote (if called separately):
 *   bid_price, ask_price, last_price, implied_volatility, underlying_price, open_interest, volume
 *
 * Greeks (delta/gamma/theta/vega) are NOT exposed by SnapTrade — Robinhood doesn't
 * provide them through their API. Theoretical Greeks could be computed from the
 * Black-Scholes model but would require a separate library.
 */

export type LiveQuote = {
  // From equity positions
  price?: number;
  market_value?: number;
  cost_basis?: number;
  open_pl?: number;
  open_pl_pct?: number;
  // From option positions
  option_mark?: number;
  option_avg_cost?: number;    // average_purchase_price per contract
  option_units?: number;       // positive = long, negative = short
  option_open_pl?: number;     // (mark - avg_cost) * units — mark is per share, *100 for per contract
  // From option quotes (may not be available for all brokerages)
  bid?: number;
  ask?: number;
  iv?: number;                 // implied volatility 0-1
  underlying_price?: number;
  open_interest?: number;
  volume?: number;
  // Computed
  dte?: number;                // days to expiration (computed from expiration date stored in DB)
};

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
      userId: user.id, userSecret: secret,
    });
    const accounts = (accountsRes.data || []) as any[];

    const prices: Record<string, LiveQuote> = {};

    // Fetch equity positions + option positions concurrently for all accounts
    const fetches = accounts.flatMap((account: any) => [
      // Regular (equity) positions
      snaptrade.accountInformation.getUserAccountPositions({
        userId: user.id, userSecret: secret, accountId: account.id,
      }).catch(() => null),
      // Options-specific positions
      snaptrade.options.listOptionHoldings({
        userId: user.id, userSecret: secret, accountId: account.id,
      }).catch(() => null),
    ]);

    const results = await Promise.all(fetches);

    // Process in pairs [equity, options, equity, options, ...]
    for (let i = 0; i < results.length; i += 2) {
      const equityRes = results[i] as any;
      const optionRes = results[i + 1] as any;

      // --- Equity positions ---
      if (equityRes) {
        const posArr = Array.isArray(equityRes.data) ? equityRes.data
          : Array.isArray(equityRes.data?.positions) ? equityRes.data.positions
          : [];
        for (const pos of posArr) {
          const sym = pos.symbol?.symbol?.ticker ?? pos.symbol?.symbol?.symbol ?? pos.symbol?.ticker;
          if (!sym) continue;
          const price = pos.price ?? 0;
          const avgCost = pos.average_purchase_price ?? 0;
          const units = pos.units ?? 0;
          const openPL = (price - avgCost) * units;
          const openPLPct = avgCost > 0 ? (openPL / (avgCost * units)) * 100 : 0;
          prices[sym] = {
            ...prices[sym],
            price,
            market_value: pos.market_value ?? price * units,
            cost_basis: avgCost * units,
            open_pl: openPL,
            open_pl_pct: openPLPct,
          };
        }
      }

      // --- Options positions ---
      if (optionRes) {
        const optArr = Array.isArray(optionRes.data) ? optionRes.data : [];
        for (const opt of optArr) {
          const detail = opt.symbol?.option_symbol;
          if (!detail) continue;

          // Unique key: TICKER|STRIKE|EXP|TYPE
          const sym = detail.underlying_symbol?.symbol || detail.ticker || opt.symbol?.symbol;
          const strike = detail.strike_price || detail.strike;
          const exp = detail.expiration_date || detail.expiration;
          const type = (detail.option_type || detail.type || 'CALL').toUpperCase();
          
          if (!sym) continue;
          const key = `${sym}|${strike}|${exp}|${type}`;

          const mark = opt.price ?? 0;   // per share
          const avgCost = opt.average_purchase_price ?? 0;  // per contract
          const units = opt.units ?? 0;   // # of contracts

          const avgCostPerShare = avgCost / 100;
          const rawPL = (mark - avgCostPerShare) * Math.abs(units) * 100;
          const optionOpenPL = units < 0 ? -rawPL : rawPL;

          prices[key] = {
            option_mark: mark,
            option_avg_cost: avgCostPerShare,
            option_units: units,
            option_open_pl: optionOpenPL,
            iv: detail.implied_volatility,
            underlying_price: detail.underlying_price,
            bid: opt.bid_price || opt.bid,
            ask: opt.ask_price || opt.ask,
            open_interest: opt.open_interest,
            volume: opt.volume,
          };
        }
      }
    }

    return NextResponse.json({ prices });
  } catch (e: any) {
    console.error('[/api/prices] Error:', e.message);
    return NextResponse.json({ error: e.message, prices: {} }, { status: 500 });
  }
}
