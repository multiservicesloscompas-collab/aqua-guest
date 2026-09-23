-- Migration: Fix RLS policies for rental_shifts table
-- Description: Align rental_shifts RLS policies with the rest of the domain tables,
--              allowing public/anon client access for all operations (SELECT, INSERT, UPDATE, DELETE).

-- 1. Drop overly restrictive policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.rental_shifts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rental_shifts;
DROP POLICY IF EXISTS "Allow all on rental_shifts" ON public.rental_shifts;

-- 2. Create permissive policy for public / anon access
CREATE POLICY "Allow all on rental_shifts"
  ON public.rental_shifts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
