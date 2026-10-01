-- Migration: Add missing USD balance columns to payment_balance_transactions table
-- Production got these columns by hand before the migration registry existed, so it marks
-- this file as already applied (see supabase/README.md).
-- Rollback:
--   ALTER TABLE public.payment_balance_transactions
--     DROP COLUMN IF EXISTS amount_out_usd, DROP COLUMN IF EXISTS amount_in_usd, DROP COLUMN IF EXISTS difference_usd;
ALTER TABLE public.payment_balance_transactions
ADD COLUMN IF NOT EXISTS amount_out_usd numeric,
ADD COLUMN IF NOT EXISTS amount_in_usd numeric,
ADD COLUMN IF NOT EXISTS difference_usd numeric;
