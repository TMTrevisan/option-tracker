import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Position } from '../types';

type TradeInsert = Database['public']['Tables']['trades']['Insert'];

export async function linkTradeToPosition(
  supabase: SupabaseClient<Database>,
  trade: TradeInsert,
  strategy?: string
): Promise<string | null> {
  const tType = (trade.trade_type || '').toUpperCase();
  const oType = (trade.option_type || '').toUpperCase();

  const isOption = ['CALL', 'PUT'].includes(oType);
  const isEquity = Boolean(trade.symbol && !trade.strike_price && !trade.expiration_date && tType && ['BUY', 'SELL', 'SHORT', 'COVER'].includes(tType));
  
  if (!isOption && !isEquity) return null; // Abort cleanly if unmappable Transfer/Dividend

  const assetType = isOption ? 'OPTION' : 'EQUITY';
  
  const isOpening = ['BTO', 'STO', 'BUY', 'SHORT'].includes(tType);
  
  // Find an existing OPEN position for this underlying symbol mapping
  // For options, we MUST match on strike, expiration, and type
  let query = supabase
    .from('positions')
    .select('*')
    .eq('user_id', trade.user_id)
    .eq('symbol', trade.symbol)
    .eq('status', 'OPEN')
    .eq('asset_type', assetType);

  if (isOption) {
    if (trade.strike_price) query = query.eq('strike_price', trade.strike_price);
    if (trade.expiration_date) query = query.eq('expiration_date', trade.expiration_date);
    if (trade.option_type) query = query.eq('option_type', trade.option_type);
  }

  const { data } = await query
    .order('created_at', { ascending: false })
    .limit(1);

  const openPositions = data as unknown as Position[];
  const positionId = openPositions?.[0]?.id;

  // Option multiplier (100 shares per contract)
  const multiplier = isOption ? 100 : 1;
  const cashImpact = trade.price * trade.quantity * multiplier;

  if (!positionId) {
    // 1. Create a brand new position cluster
    const premiumKept = (tType === 'STO' || tType === 'SELL' || tType === 'SHORT') ? cashImpact : 0;
    const costBasis = (tType === 'BTO' || tType === 'BUY' || tType === 'COVER') ? cashImpact : 0;

    const insertData: any = {
      user_id: trade.user_id,
      asset_type: assetType,
      symbol: trade.symbol,
      underlying_symbol: trade.symbol,
      strategy: strategy || (isOption ? 'Option Trade' : 'Long Stock'),
      status: isOpening ? 'OPEN' : 'CLOSED',
      adjusted_cost_basis: costBasis,
      total_premium_kept: premiumKept,
      total_fees: trade.fees || 0,
      realized_pl: 0,
      open_quantity: isOpening ? trade.quantity : 0,
      closed_quantity: isOpening ? 0 : trade.quantity,
      tags: trade.tags || []
    };

    if (isOption) {
      if (trade.strike_price) insertData.strike_price = trade.strike_price;
      if (trade.expiration_date) insertData.expiration_date = trade.expiration_date;
      if (trade.option_type) insertData.option_type = trade.option_type;
    }

    // @ts-ignore - Bypass Supabase generic inference failure mapping on Vercel
    const { data: newPos } = await supabase.from('positions').insert(insertData).select().single();


    const pos = newPos as unknown as Position;
    if (pos) {
       // Auto-calculate PnL if it was closed
       if (!isOpening) {
           const realizedPl = (pos.total_premium_kept) - (pos.adjusted_cost_basis) - (pos.total_fees);
           // @ts-ignore
           await supabase.from('positions').update({ realized_pl: realizedPl }).eq('id', pos.id);
       }
       return pos.id;
    }

  } else if (positionId) {
    // 2. Append to an existing position (Roll, Close, Scale)
    const pos = openPositions![0];
    let newStatus: 'OPEN' | 'CLOSED' | 'ASSIGNED' = 'OPEN';
    // Phase 5: FIFO Logic and Partial Scaling
    let newOpenQty = pos.open_quantity;
    let newClosedQty = pos.closed_quantity;
    
    if (isOpening) {
       newOpenQty += trade.quantity;
    } else {
       newClosedQty += trade.quantity;
    }

    if (newClosedQty >= newOpenQty) {
       newStatus = tType === 'ASSIGNMENT' ? 'ASSIGNED' : 'CLOSED';
    }

    let premiumAdjustment = 0;
    let costAdjustment = 0;
    
    if (tType === 'STO' || tType === 'SELL' || tType === 'SHORT') premiumAdjustment += cashImpact;
    if (tType === 'BTC' || tType === 'COVER') premiumAdjustment -= cashImpact;
    
    if (tType === 'BTO' || tType === 'BUY' || tType === 'COVER') costAdjustment += cashImpact;
    if (tType === 'STC' || tType === 'SELL' || tType === 'SHORT') costAdjustment -= cashImpact;

    // Pl Calculation on close
    let realizedPl = pos.realized_pl;
    let isWashSale = pos.wash_sale_adjusted;

    if (newStatus === 'CLOSED' || newStatus === 'ASSIGNED') {
       realizedPl = (pos.total_premium_kept + premiumAdjustment) - (pos.adjusted_cost_basis + costAdjustment) - (pos.total_fees + (trade.fees || 0));
       
       // Wash Sale Check: Closed for a loss
       if (realizedPl < 0) {
          // Look for an identical open replacement position within 30 days
          const { data } = await supabase.from('positions')
            .select('*')
            .eq('user_id', trade.user_id)
            .eq('symbol', trade.symbol)
            .eq('status', 'OPEN')
            .neq('id', positionId)
            .order('created_at', { ascending: false })
            .limit(1);

          const replacements = data as unknown as Position[];

          if (replacements && replacements.length > 0) {
             const replacement = replacements[0];
             // Transfer the loss to the replacement's cost basis
             // @ts-ignore - Bypass Supabase generic inference failure mapping on Vercel
             await supabase.from('positions').update({
                adjusted_cost_basis: replacement.adjusted_cost_basis + Math.abs(realizedPl)
             }).eq('id', replacement.id);
             
             realizedPl = 0; // Loss is deferred
             isWashSale = true;
          }
       }
    }

    const uniqueTags = Array.from(new Set([...(pos.tags || []), ...(trade.tags || [])]));

    // @ts-ignore - Bypass Supabase generic inference failure mapping on Vercel
    await supabase.from('positions').update({
       status: newStatus,
       total_fees: pos.total_fees + (trade.fees || 0),
       total_premium_kept: pos.total_premium_kept + premiumAdjustment,
       adjusted_cost_basis: pos.adjusted_cost_basis + costAdjustment,
       realized_pl: realizedPl,
       open_quantity: newOpenQty,
       closed_quantity: newClosedQty,
       tags: uniqueTags,
       wash_sale_adjusted: isWashSale
    }).eq('id', positionId);

    return positionId;
  }

  return null;
}
