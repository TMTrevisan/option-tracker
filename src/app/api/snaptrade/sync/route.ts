import { createClient } from '@/utils/supabase/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';
import { linkTradeToPosition } from '@/lib/services/positions';

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const pushLog = (msg: string) => {
        controller.enqueue(encoder.encode(msg + '\n'));
      };

      try {
        pushLog("> Booting RollTrackr Scraping Engine...");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized User Configuration');

        const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
        const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();
        const secret = user.user_metadata?.snaptrade_secret;

        if (!clientId || !consumerKey || !secret) {
          throw new Error('Missing strict SnapTrade cryptographic configuration.');
        }

        const snaptrade = new Snaptrade({ clientId, consumerKey });

        pushLog("> Authenticating with SnapTrade Hub...");
        const accountsRes = await snaptrade.accountInformation.listUserAccounts({ userId: user.id, userSecret: secret });
        const accounts = accountsRes.data || [];
        
        if (accounts.length === 0) throw new Error('No brokerage accounts bound to profile.');

        pushLog(`> Discovered ${accounts.length} active Brokerage Profile(s).`);
        pushLog("> Initiating high-speed concurrent ledger scrape...");

        let allRawActivities: any[] = [];

        // Issue all network requests to SnapTrade concurrently
        const fetchPromises = accounts.map(account => 
          snaptrade.accountInformation.getAccountActivities({ 
              userId: user.id, 
              userSecret: secret, 
              accountId: account.id,
              startDate: "2024-01-01" 
          }).catch(err => {
              pushLog(`! Warning: Failed fetching ledger for Broker Profile ${account.id}`);
              return null;
          })
        );

        const responses = await Promise.all(fetchPromises);

        for (const activitiesResponse of responses) {
            if (!activitiesResponse) continue;

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
            pushLog('✅ No historic activities found across any connected accounts.');
            controller.close();
            return;
        }

        const validTrades = allRawActivities.filter((a: any) => a.type && /BUY|SELL/i.test(a.type));
        pushLog(`> Siphoned ${validTrades.length} executable trade records (Bypassed ${allRawActivities.length - validTrades.length} Non-Trade Transfers/Dividends).`);
        pushLog(`> Routing executions into Roll Engine...`);

        let insertedCount = 0;

        for (let i = 0; i < validTrades.length; i++) {
          const trade = validTrades[i];
          if (i > 0 && i % 50 === 0) {
              pushLog(`  ... securely routed ${i} / ${validTrades.length} records...`);
          }

          const isBuy = /BUY/i.test(trade.type);
          const tt = isBuy ? 'Buy' : 'Sell'; 

          const qty = trade.units ? Math.abs(trade.units) : 0;
          const parsedPrice = trade.price || 0;
          const baseSymbol = trade.symbol?.symbol || trade.symbol?.raw_symbol || 'UNKNOWN';

          let strike_price = null;
          let expiration_date = null;
          let option_type = null;

          if (trade.option_symbol) {
              if (typeof trade.option_symbol === 'object') {
                  strike_price = trade.option_symbol.strike_price || trade.option_symbol.strike;
                  expiration_date = trade.option_symbol.expiration_date || trade.option_symbol.expiration;
                  option_type = trade.option_symbol.option_type || trade.option_symbol.type;
                  if (option_type && option_type.toLowerCase().startsWith('c')) option_type = 'Call';
                  if (option_type && option_type.toLowerCase().startsWith('p')) option_type = 'Put';
              } else if (typeof trade.option_symbol === 'string') {
                  const occMatch = trade.option_symbol.match(/^[A-Z]+\s*(\d{6})([CP])(\d{8})$/i);
                  if (occMatch) {
                      const m2 = occMatch[1];
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

          const positionId = await linkTradeToPosition(supabase, tradeInsert as any);
          if (positionId) {
              (tradeInsert as any).position_id = positionId;
          }

          const { error } = await supabase.from('trades').insert(tradeInsert as any);
          
          if (!error) insertedCount++;
          else if (error.code !== '23505') {
              throw new Error(`Database Constraint Violation (${error.code}): ${error.message}`);
          }
        }

        pushLog(`\n✅ Historic Sync Complete!`);
        pushLog(`Analyzed: ${allRawActivities.length} total account payload actions.`);
        pushLog(`Ignored: ${allRawActivities.length - validTrades.length} passive non-executable events.`);
        pushLog(`Imported: ${insertedCount} new executable transactions.`);
        pushLog(`Bypassed: ${validTrades.length - insertedCount} safely deduplicated trades.`);
        
        controller.close();
      } catch (error: any) {
        pushLog(`\n❌ ERROR: ${error.message}`);
        controller.close();
      }
    }
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
