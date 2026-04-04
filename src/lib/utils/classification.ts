/**
 * Centralized strategy classification logic for RollTrackr.
 * Maps trade attributes to human-readable strategies.
 */

export type TradeParams = {
  tradeType: string;
  optionType?: string | null;
  assetType?: 'EQUITY' | 'OPTION';
  symbol: string;
};

export function autoClassifyStrategy(params: TradeParams): string {
  const { tradeType, optionType, assetType, symbol } = params;
  const tt = tradeType.toUpperCase();
  const ot = (optionType || '').toUpperCase();
  const at = assetType || (ot ? 'OPTION' : 'EQUITY');

  if (at === 'OPTION') {
    if (ot === 'CALL') {
      return (tt === 'STO' || tt === 'SELL') ? 'Short Call' : 'Long Call';
    }
    if (ot === 'PUT') {
      return (tt === 'STO' || tt === 'SELL') ? 'Short Put' : 'Long Put';
    }
    return 'Option Trade';
  }

  // Equity
  return (tt === 'SHORT' || tt === 'SELL' && !/BUY/i.test(tt)) ? 'Short Stock' : 'Long Stock';
}

/**
 * Heuristic to detect rolls/campaigns.
 * If a new trade is within 96 hours of a closing trade in the same symbol,
 * they might be part of the same "Campaign".
 */
export function isLikelyRoll(lastTradeDate: string, newTradeDate: string): boolean {
  const last = new Date(lastTradeDate).getTime();
  const next = new Date(newTradeDate).getTime();
  const diff = Math.abs(next - last);
  const NINETY_SIX_HOURS = 96 * 60 * 60 * 1000;
  return diff <= NINETY_SIX_HOURS;
}
