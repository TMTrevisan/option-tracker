-- RollTrackr Supabase Schema Definition
-- Run this in your Supabase SQL Editor to initialize the database.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables
CREATE TABLE public.brokerage_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    broker TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC DEFAULT 0,
    is_manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.brokerage_accounts(id) ON DELETE SET NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('EQUITY', 'OPTION')),
    symbol TEXT NOT NULL,
    underlying_symbol TEXT,
    strategy TEXT, -- e.g., 'Covered Call', 'Cash Secured Put', 'Long Stock'
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'ASSIGNED')),
    adjusted_cost_basis NUMERIC DEFAULT 0,
    total_premium_kept NUMERIC DEFAULT 0,
    total_fees NUMERIC DEFAULT 0,
    realized_pl NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.brokerage_accounts(id) ON DELETE SET NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('BTO', 'STC', 'STO', 'BTC', 'ASSIGNMENT', 'EXERCISE', 'BUY', 'SELL')),
    symbol TEXT NOT NULL,
    strike_price NUMERIC,
    expiration_date DATE,
    option_type TEXT CHECK (option_type IN ('CALL', 'PUT')),
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    fees NUMERIC DEFAULT 0,
    trade_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Setup
ALTER TABLE public.brokerage_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own accounts" 
ON public.brokerage_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" 
ON public.brokerage_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.brokerage_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.brokerage_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own positions" 
ON public.positions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own positions" 
ON public.positions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" 
ON public.positions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own positions" 
ON public.positions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own trades" 
ON public.trades FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" 
ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades FOR DELETE USING (auth.uid() = user_id);
