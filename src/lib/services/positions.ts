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
  
  if (!isOption && !isEquity) return null; 

  const assetType = isOption ? 'OPTION' : 'EQUITY';
  
  // 1. Find an existing OPEN position
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
  const existingPos = openPositions?.[0];

  // Option multiplier (100 shares per contract)
  const multiplier = isOption ? 100 : 1;
  const cashImpact = trade.price * trade.quantity * multiplier;

  if (!existingPos) {
    // 2. CREATE NEW POSITION
    const isShortIntent = /Short|Covered|STO/i.test(strategy || '');
    const side = isShortIntent ? 'SHORT' : (['BUY', 'BTO', 'LONG'].includes(tType) ? 'LONG' : 'SHORT');
    
    const premiumKept = (tType === 'STO' || tType === 'SELL' || tType === 'SHORT') ? cashImpact : 0;
    const costBasis = (tType === 'BTO' || tType === 'BUY' || tType === 'COVER') ? cashImpact : 0;

    const insertData: Database['public']['Tables']['positions']['Insert'] = {
      user_id: trade.user_id,
      asset_type: assetType as 'OPTION' | 'EQUITY',
      symbol: trade.symbol,
      underlying_symbol: trade.symbol,
      strategy: strategy || (isOption ? (side === 'LONG' ? 'Long Option' : 'Short Option') : (side === 'LONG' ? 'Long Stock' : 'Short Stock')),
      status: 'OPEN',
      side: side,
      adjusted_cost_basis: costBasis,
      total_premium_kept: premiumKept,
      total_fees: trade.fees || 0,
      realized_pl: 0,
      open_quantity: trade.quantity,
      closed_quantity: 0,
      wash_sale_adjusted: false,
      tags: trade.tags || []
    };

    if (isOption) {
      insertData.strike_price = trade.strike_price;
      insertData.expiration_date = trade.expiration_date;
      insertData.option_type = trade.option_type;
    }

    // @ts-ignore
    const { data: newPos, error } = await supabase.from('positions').insert(insertData as any).select().single();
    if (error) {
      console.error('Error creating position:', error);
      return null;
    }
    return (newPos as any).id;

  } else {
    // 3. UPDATE EXISTING POSITION
    const pos = existingPos;
    const isLong = pos.side === 'LONG';
    
    let isOpening = false;
    if (isLong) {
      isOpening = ['BUY', 'BTO', 'LONG'].includes(tType);
    } else {
      isOpening = ['SELL', 'STO', 'SHORT'].includes(tType);
    }

    let newOpenQty = Number(pos.open_quantity || 0);
    let newClosedQty = Number(pos.closed_quantity || 0);
    
    if (isOpening) {
       newOpenQty += trade.quantity;
    } else {
       newClosedQty += trade.quantity;
    }

    let newStatus = 'OPEN';
    if (newClosedQty >= newOpenQty) {
       newStatus = (tType === 'ASSIGNMENT' || tType === 'EXERCISE') ? 'ASSIGNED' : 'CLOSED';
    }

    // Money math
    let premiumAdjustment = 0;
    let costAdjustment = 0;
    
    // For ALL SELL/SHORT/STO trades
    if (['SELL', 'SHORT', 'STO', 'STC'].includes(tType)) {
      if (isLong) {
        costAdjustment -= cashImpact; // Reducing cost basis (closing a long)
      } else {
        premiumAdjustment += cashImpact; // Adding to premium (opening/scaling a short)
      }
    }
    
    // For ALL BUY/LONG/BTO/BTC trades
    if (['BUY', 'LONG', 'BTO', 'BTC', 'COVER'].includes(tType)) {
      if (isLong) {
        costAdjustment += cashImpact; // Adding to cost basis (opening/scaling a long)
      } else {
        premiumAdjustment -= cashImpact; // Reducing premium (closing a short)
      }
    }

    // Net P/L calculation on close
    let realizedPl = Number(pos.realized_pl || 0);
    if (newStatus === 'CLOSED' || newStatus === 'ASSIGNED') {
       realizedPl = (Number(pos.total_premium_kept || 0) + premiumAdjustment) - (Number(pos.adjusted_cost_basis || 0) + costAdjustment) - (Number(pos.total_fees || 0) + (trade.fees || 0));
    }

    const uniqueTags = Array.from(new Set([...(pos.tags || []), ...(trade.tags || [])]));

    // @ts-ignore
    const { error } = await supabase.from('positions')
      .update({
        status: newStatus,
        total_fees: Number(pos.total_fees || 0) + (trade.fees || 0),
        total_premium_kept: Number(pos.total_premium_kept || 0) + premiumAdjustment,
        adjusted_cost_basis: Number(pos.adjusted_cost_basis || 0) + costAdjustment,
        realized_pl: realizedPl,
        open_quantity: newOpenQty,
        closed_quantity: newClosedQty,
        tags: uniqueTags
      } as any)
      .eq('id', pos.id);

    if (error) {
      console.error('Error updating position:', error);
      return null;
    }

    return pos.id;
  }
}
