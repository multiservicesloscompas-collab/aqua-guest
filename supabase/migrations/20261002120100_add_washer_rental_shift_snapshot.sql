-- Rollback: ALTER TABLE public.washer_rentals DROP COLUMN IF EXISTS shift_label, DROP COLUMN IF EXISTS shift_hours, DROP COLUMN IF EXISTS shift_price_usd, DROP COLUMN IF EXISTS shift_divisa_discount_usd;

ALTER TABLE public.washer_rentals
  ADD COLUMN IF NOT EXISTS shift_label text,
  ADD COLUMN IF NOT EXISTS shift_hours integer,
  ADD COLUMN IF NOT EXISTS shift_price_usd numeric,
  ADD COLUMN IF NOT EXISTS shift_divisa_discount_usd numeric;
