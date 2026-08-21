-- Migration: Migrate hardcoded washer rental shifts to a dynamic catalog table.
--
-- Goals:
--   1. Create `public.rental_shifts` with the minimum viable columns to model
--      the dynamic shift configuration.
--   2. Enable Row Level Security with policies that allow:
--        - any user to read active shifts;
--        - authenticated users to manage the catalog.
--   3. Seed the three classic shifts (medio / completo / doble) with stable
--      UUIDs so historical rentals and the offline fallback keep mapping
--      deterministically.
--   4. Backfill `public.washer_rentals.shift` so legacy string identifiers
--      point to the new UUIDs.
--
-- Notes:
--   - The script is idempotent thanks to `IF NOT EXISTS` clauses and
--     `ON CONFLICT (id) DO UPDATE` for the seed inserts.
--   - We intentionally do not introduce foreign key constraints between
--     `washer_rentals.shift` and `rental_shifts.id` because some historical
--     rows may still be invalid and we want the migration to be a forward-only
--     step. Application code is the source of truth for lookup.

-- =========================================================================
-- 1. Create table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rental_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  price_usd numeric NOT NULL CHECK (price_usd >= 0),
  hours integer NOT NULL CHECK (hours > 0),
  has_divisa_discount boolean NOT NULL DEFAULT false,
  divisa_discount_amount numeric NOT NULL DEFAULT 1.00 CHECK (divisa_discount_amount >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- =========================================================================
-- 2. Enable Row Level Security
-- =========================================================================
ALTER TABLE public.rental_shifts ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. RLS policies
-- =========================================================================
-- Allow any caller (including anonymous Supabase clients) to read the catalog.
-- Writes are gated on `auth.role() = 'authenticated'`.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rental_shifts;
CREATE POLICY "Enable read access for all users"
  ON public.rental_shifts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.rental_shifts;
CREATE POLICY "Enable all access for authenticated users"
  ON public.rental_shifts
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =========================================================================
-- 4. Seed deterministic base shifts
-- =========================================================================
-- These UUIDs are stable on purpose: the offline fallback hardcodes them and
-- historical rentals must remap to them. Do not change without a coordinated
-- migration.
INSERT INTO public.rental_shifts (
  id,
  label,
  price_usd,
  hours,
  has_divisa_discount,
  divisa_discount_amount,
  is_active
)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Medio Turno', 4.00, 8, false, 1.00, true),
  ('d2222222-2222-2222-2222-222222222222', 'Completo', 6.00, 24, true, 1.00, true),
  ('d3333333-3333-3333-3333-333333333333', 'Doble', 12.00, 48, false, 1.00, true)
ON CONFLICT (id) DO UPDATE
SET
  label = EXCLUDED.label,
  price_usd = EXCLUDED.price_usd,
  hours = EXCLUDED.hours,
  has_divisa_discount = EXCLUDED.has_divisa_discount,
  divisa_discount_amount = EXCLUDED.divisa_discount_amount,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =========================================================================
-- 5. Safe historical data migration
-- =========================================================================
-- Map legacy shift keys to the seeded UUIDs. Each UPDATE is guarded so that
-- a failure (or re-run) does not corrupt already migrated rows.
UPDATE public.washer_rentals
SET shift = 'd1111111-1111-1111-1111-111111111111'
WHERE shift = 'medio';

UPDATE public.washer_rentals
SET shift = 'd2222222-2222-2222-2222-222222222222'
WHERE shift = 'completo';

UPDATE public.washer_rentals
SET shift = 'd3333333-3333-3333-3333-333333333333'
WHERE shift = 'doble';

-- =========================================================================
-- 6. Indexes to keep the catalog lookups cheap
-- =========================================================================
-- Application code frequently queries `rental_shifts` by id (FK-like lookup
-- from `washer_rentals.shift`) and filters by `is_active`. The default index
-- on the primary key already covers the first use case; the partial index
-- below covers the common "list active shifts" query.
CREATE INDEX IF NOT EXISTS rental_shifts_active_idx
  ON public.rental_shifts (label)
  WHERE is_active = true AND deleted_at IS NULL;
