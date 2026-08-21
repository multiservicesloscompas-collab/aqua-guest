-- Migration: Add missing USD balance columns to payment_balance_transactions table
ALTER TABLE public.payment_balance_transactions 
ADD COLUMN IF NOT EXISTS amount_out_usd numeric,
ADD COLUMN IF NOT EXISTS amount_in_usd numeric,
ADD COLUMN IF NOT EXISTS difference_usd numeric;
