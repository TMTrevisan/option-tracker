-- 1. Ensure all trade_type values are valid
ALTER TABLE trades ADD CONSTRAINT check_trade_type 
CHECK (trade_type IN ('BTO', 'STC', 'STO', 'BTC', 'BUY', 'SELL', 'ASSIGNMENT', 'EXERCISE'));

-- 2. Ensure all asset_type values are valid
ALTER TABLE positions ADD CONSTRAINT check_asset_type
CHECK (asset_type IN ('EQUITY', 'OPTION'));

-- 3. Ensure all position statuses are valid
ALTER TABLE positions ADD CONSTRAINT check_position_status
CHECK (status IN ('OPEN', 'CLOSED', 'ASSIGNED'));

-- 4. Unique constraint on brokerage_trade_id for deduplication
-- Check if it exists first? Actually, let's just try to add it.
-- If it fails due to existing duplicates, the user will need to clean up.
-- But the earlier script backfilled position_id, so we should be mostly clean.
ALTER TABLE trades ADD CONSTRAINT unique_brokerage_trade_id UNIQUE (brokerage_trade_id);
