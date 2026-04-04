-- RollTrackr Schema Upgrade
-- Run this in your Supabase SQL Editor if you have many existing trades with null position_id

-- 1. Ensure position_id in trades handles linking
-- (Already handled by linkTradeToPosition service, but this SQL helps backfill)

UPDATE trades t
SET position_id = p.id
FROM positions p
WHERE t.symbol = p.symbol
  AND t.user_id = p.user_id
  AND t.position_id IS NULL
  AND p.status = 'OPEN';

-- 2. Add an index for faster lookup during live price updates
CREATE INDEX IF NOT EXISTS idx_positions_symbol_status ON positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_trades_position_id ON trades(position_id);

-- 3. (Optional) Enforce uniqueness on brokerage sync
-- ALTER TABLE trades ADD CONSTRAINT unq_brokerage_trade UNIQUE (brokerage_trade_id);
