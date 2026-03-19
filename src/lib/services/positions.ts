import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

type TradeInsert = Database['public']['Tables']['trades']['Insert'];

export async function linkTradeToPosition(
  supabase: SupabaseClient<Database>,
  trade: TradeInsert,
  strategy?: string
): Promise<string | null> {
  const isOption = ['CALL', 'PUT'].includes(trade.option_type || '');
  const assetType = isOption ? 'OPTION' : 'EQUITY';
  
  const isOpening = ['BTO', 'STO', 'BUY'].includes(trade.trade_type);
  
  // Find an existing OPEN position for this underlying symbol mapping
  const { data: openPositions } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', trade.user_id)
    .eq('symbol', trade.symbol)
    .eq('status', 'OPEN')
    .eq('asset_type', assetType)
    .order('created_at', { ascending: false })
    .limit(1);

  const positionId = openPositions?.[0]?.id;

  // Option multiplier (100 shares per contract)
  const multiplier = isOption ? 100 : 1;
  const cashImpact = trade.price * trade.quantity * multiplier;

  if (isOpening && !positionId) {
    // 1. Create a brand new position cluster
    const premiumKept = (trade.trade_type === 'STO' || trade.trade_type === 'SELL') ? cashImpact : 0;
    const costBasis = (trade.trade_type === 'BTO' || trade.trade_type === 'BUY') ? cashImpact : 0;

    const { data: newPos } = await supabase.from('positions').insert({
      user_id: trade.user_id,
      asset_type: assetType,
      symbol: trade.symbol,
      underlying_symbol: trade.symbol,
      strategy: strategy || (isOption ? 'Option Trade' : 'Long Stock'),
      status: 'OPEN',
      adjusted_cost_basis: costBasis,
      total_premium_kept: premiumKept,
      total_fees: trade.fees || 0,
      realized_pl: 0,
      open_quantity: trade.quantity,
      closed_quantity: 0,
      tags: trade.tags || []
    }).select().single();
    
    if (newPos) return newPos.id;

  } else if (positionId) {
    // 2. Append to an existing position (Roll, Close, Scale)
    const pos = openPositions![0];
    // Phase 5: FIFO Logic and Partial Scaling
    let newOpenQty = pos.open_quantity;
    let newClosedQty = pos.closed_quantity;
    
    if (isOpening) {
       newOpenQty += trade.quantity;
    } else {
       newClosedQty += trade.quantity;
    }

    if (newClosedQty >= newOpenQty) {
       newStatus = trade.trade_type === 'ASSIGNMENT' ? 'ASSIGNED' : 'CLOSED';
    }

    // Pl Calculation on close
    let realizedPl = pos.realized_pl;
    let isWashSale = pos.wash_sale_adjusted;

    if (newStatus === 'CLOSED' || newStatus === 'ASSIGNED') {
       realizedPl = (pos.total_premium_kept + premiumAdjustment) - (pos.adjusted_cost_basis + costAdjustment) - (pos.total_fees + (trade.fees || 0));
       
       // Wash Sale Check: Closed for a loss
       if (realizedPl < 0) {
          // Look for an identical open replacement position within 30 days
          const { data: replacements } = await supabase.from('positions')
            .select('id, adjusted_cost_basis')
            .eq('user_id', trade.user_id)
            .eq('symbol', trade.symbol)
            .eq('status', 'OPEN')
            .neq('id', positionId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (replacements && replacements.length > 0) {
             const replacement = replacements[0];
             // Transfer the loss to the replacement's cost basis
             await supabase.from('positions').update({
                adjusted_cost_basis: replacement.adjusted_cost_basis + Math.abs(realizedPl)
             }).eq('id', replacement.id);
             
             realizedPl = 0; // Loss is deferred
             isWashSale = true;
          }
       }
    }

    const uniqueTags = Array.from(new Set([...(pos.tags || []), ...(trade.tags || [])]));

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
