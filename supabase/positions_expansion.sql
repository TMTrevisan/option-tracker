-- Expand positions table to support discrete option contract tracking
ALTER TABLE public.positions
ADD COLUMN IF NOT EXISTS strike_price NUMERIC,
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS option_type TEXT CHECK (option_type IN ('CALL', 'PUT')),
ADD COLUMN IF NOT EXISTS occ_symbol TEXT;

-- Create an index for faster lookup during trade linking
CREATE INDEX IF NOT EXISTS idx_positions_lookup 
ON public.positions (user_id, symbol, status, asset_type, strike_price, expiration_date, option_type);
