-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: positions (Top-level Option or Equity clusters)
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'OPTION' or 'EQUITY'
  symbol TEXT NOT NULL,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' or 'CLOSED'
  
  -- Option specific clusters
  legs_count INTEGER DEFAULT 0,
  net_delta NUMERIC, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: trades (The atomic execution events)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  
  trade_type TEXT NOT NULL, -- 'Buy' or 'Sell'
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  fees NUMERIC NOT NULL DEFAULT 0,
  
  -- Option specific legs
  strike_price NUMERIC,
  expiration_date DATE,
  option_type TEXT, -- 'Call' or 'Put'
  
  trade_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  tags TEXT[],

  -- Integration Identifiers
  brokerage_trade_id TEXT UNIQUE,
  source TEXT DEFAULT 'manual',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: brokerage_accounts
CREATE TABLE IF NOT EXISTS public.brokerage_accounts (
  id UUID PRIMARY KEY, -- Snaptrade sends specific external UUIDs
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  account_number TEXT,
  connection_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
