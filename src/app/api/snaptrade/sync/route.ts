import { createClient } from '@/utils/supabase/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';
import { linkTradeToPosition } from '@/lib/services/positions';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();
  const secret = user.user_metadata?.snaptrade_secret;

  if (!clientId || !consumerKey || !secret) {
    return NextResponse.json({ error: 'Missing SnapTrade configuration or secret.' }, { status: 500 });
  }

  const snaptrade = new Snaptrade({ clientId, consumerKey });

  try {
    const accountsRes = await snaptrade.accountInformation.listUserAccounts({ userId: user.id, userSecret: secret });
    const accounts = accountsRes.data || [];
    
    if (accounts.length === 0) return NextResponse.json({ error: 'No brokerage accounts found.' }, { status: 400 });

    let allRawActivities: any[] = [];

    // Issue all network requests to SnapTrade concurrently to bypass Vercel's 10.0s execution timeout
    const fetchPromises = accounts.map(account => 
      snaptrade.accountInformation.getAccountActivities({ 
          userId: user.id, 
          userSecret: secret, 
          accountId: account.id,
          startDate: "2024-01-01" 
      }).catch(err => {
          console.error(`Failed fetching for ${account.id}`, err);
          return null;
      })
    );

    const responses = await Promise.all(fetchPromises);

    for (const activitiesResponse of responses) {
        if (!activitiesResponse) continue;

        // Handle generic Object vs Array bypass
        let rawActivities = activitiesResponse.data as any;
        if (rawActivities && typeof rawActivities === 'object' && Array.isArray(rawActivities.activities)) {
            rawActivities = rawActivities.activities;
        } else if (rawActivities && typeof rawActivities === 'object' && Array.isArray(rawActivities.data)) {
            rawActivities = rawActivities.data;
        }

        if (Array.isArray(rawActivities)) {
            allRawActivities = [...allRawActivities, ...rawActivities];
        }
    }

    if (allRawActivities.length === 0) {
        return NextResponse.json({ success: true, message: '✅ No historic activities found across any connected accounts.' });
    }

    // Filter only BUY / SELL trade executions (ignore DIVIDEND, TRANSFER)
    const validTrades = allRawActivities.filter((a: any) => a.type && /BUY|SELL/i.test(a.type));

    let insertedCount = 0;

    for (const trade of validTrades) {
      // Parse normalized fields
      const isBuy = /BUY/i.test(trade.type);
      const tt = isBuy ? 'Buy' : 'Sell'; 

      const qty = trade.units ? Math.abs(trade.units) : 0;
      const parsedPrice = trade.price || 0;
      const baseSymbol = trade.symbol?.symbol || trade.symbol?.raw_symbol || 'UNKNOWN';

      let strike_price = null;
      let expiration_date = null;
      let option_type = null;

      // Extract native option legs via SnapTrade's OptionSymbol object, OR raw regex string matching (AAPL 240119C00150000)
      if (trade.option_symbol) {
          if (typeof trade.option_symbol === 'object') {
              strike_price = trade.option_symbol.strike_price || trade.option_symbol.strike;
              expiration_date = trade.option_symbol.expiration_date || trade.option_symbol.expiration;
              option_type = trade.option_symbol.option_type || trade.option_symbol.type;
              if (option_type && option_type.toLowerCase().startsWith('c')) option_type = 'Call';
              if (option_type && option_type.toLowerCase().startsWith('p')) option_type = 'Put';
          } else if (typeof trade.option_symbol === 'string') {
              // Raw OCC string parser fallback (AAPL  240119C00150000)
              const occMatch = trade.option_symbol.match(/^[A-Z]+\s*(\d{6})([CP])(\d{8})$/i);
              if (occMatch) {
                  const m2 = occMatch[1]; // 240119
                  expiration_date = `20${m2.substring(0,2)}-${m2.substring(2,4)}-${m2.substring(4,6)}`;
                  option_type = occMatch[2].toUpperCase() === 'C' ? 'Call' : 'Put';
                  strike_price = parseFloat(occMatch[3]) / 1000;
              }
          }
      }

      const tradeInsert = {
          user_id: user.id,
          trade_type: tt,
          symbol: baseSymbol,
          quantity: qty,
          price: parsedPrice,
          fees: trade.fee || 0,
          trade_date: trade.trade_date || trade.settlement_date || new Date().toISOString(),
          brokerage_trade_id: trade.id,
          notes: 'Auto-Imported from SnapTrade',
          tags: ['#historic-sync']
      };

      if (strike_price) (tradeInsert as any).strike_price = strike_price;
      if (expiration_date) (tradeInsert as any).expiration_date = expiration_date;
      if (option_type) (tradeInsert as any).option_type = option_type;

      // Ensure Trade is algorithmically bound to a parent Equity or Option Position
      const positionId = await linkTradeToPosition(supabase, tradeInsert as any);
      if (positionId) {
          (tradeInsert as any).position_id = positionId;
      }

      // Insert logic with deduplication
      const { error } = await supabase.from('trades').insert(tradeInsert as any);
      
      // If error is unique violation (23505), we just safely ignore the duplicate!
      if (!error) insertedCount++;
      else if (error.code !== '23505') {
          console.error("Trade Insert Error:", error);
          throw new Error(`Database Error (${error.code}): ${error.message}`);
      }
    }

    return NextResponse.json({ 
        success: true, 
        message: `✅ Historic Sync Complete!\n\nAnalyzed: ${allRawActivities.length} account activities.\nIgnored: ${allRawActivities.length - validTrades.length} non-trade events (dividends, ACAT transfers).\nImported: ${insertedCount} new executable trades.\nBypassed: ${validTrades.length - insertedCount} safely deduplicated trades.` 
    });

  } catch (error: any) {
    console.error("Sync Error:", error.response?.data || error.message);
    return NextResponse.json({ error: `SnapTrade Scraper Failed: ${error.message}` }, { status: 500 });
  }
}
