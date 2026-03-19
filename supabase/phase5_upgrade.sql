-- Phase 5 Upgrades
-- Run this in your Supabase SQL Editor to apply Phase 5 schema expansions.

-- 1. Upgrades to `trades` table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Upgrades to `positions` table
ALTER TABLE public.positions 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS open_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS closed_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS wash_sale_adjusted boolean DEFAULT false;

-- 3. Backfill existing positions (Optional if you want legacy data to have basic quantities)
-- UPDATE public.positions SET open_quantity = 0, closed_quantity = 100 WHERE status = 'CLOSED';
