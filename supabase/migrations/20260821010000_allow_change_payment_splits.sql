-- Vuelto (change) support for divisa payments.
--
-- USD circulates only as bills in Venezuela (no coins/cents), so a divisa
-- payment almost never matches the total exactly: the business keeps the
-- bill handed over and returns change. Change is represented as an
-- additional payment_split row with a NON-POSITIVE amount, so
-- sum(amount_bs) over a parent's splits keeps equalling its total without
-- any consumer needing to know about change specifically.
--
-- Scope: sales + rentals ONLY. expense_payment_splits intentionally keeps
-- its original non-negative-only constraint — Expenses is out of scope for
-- this feature, and the isolation is enforced here at the schema level.

-- 1. Discriminator column, defaulted so every existing row and every
--    existing INSERT (which never sends this column) keeps working exactly
--    as before.
ALTER TABLE public.sale_payment_splits
  ADD COLUMN IF NOT EXISTS payment_kind text NOT NULL DEFAULT 'payment';
ALTER TABLE public.rental_payment_splits
  ADD COLUMN IF NOT EXISTS payment_kind text NOT NULL DEFAULT 'payment';

-- 2. Drop the legacy non-negative CHECKs on amount_bs / amount_usd.
--    Found by definition rather than by name: the initial schema declared
--    them inline, so Postgres auto-generated their names and the live
--    database's names may not match what a fresh reading of that file
--    would suggest.
DO $$
DECLARE
  target_table text;
  target_constraint record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['sale_payment_splits', 'rental_payment_splits']
  LOOP
    FOR target_constraint IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE ns.nspname = 'public'
        AND rel.relname = target_table
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) ~ '(amount_bs|amount_usd)'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        target_table,
        target_constraint.conname
      );
    END LOOP;
  END LOOP;
END $$;

-- 3. Re-add stricter, kind-aware constraints: a 'payment' row must be
--    non-negative (unchanged from before); a 'change' row must be
--    non-positive (new). This is strictly tighter than simply dropping the
--    sign check would have been.
ALTER TABLE public.sale_payment_splits
  ADD CONSTRAINT sale_payment_splits_payment_kind_check
    CHECK (payment_kind IN ('payment', 'change')),
  ADD CONSTRAINT sale_payment_splits_amount_bs_sign_check
    CHECK (
      (payment_kind = 'payment' AND amount_bs >= 0)
      OR (payment_kind = 'change' AND amount_bs <= 0)
    ),
  ADD CONSTRAINT sale_payment_splits_amount_usd_sign_check
    CHECK (
      amount_usd IS NULL
      OR (payment_kind = 'payment' AND amount_usd >= 0)
      OR (payment_kind = 'change' AND amount_usd <= 0)
    );

ALTER TABLE public.rental_payment_splits
  ADD CONSTRAINT rental_payment_splits_payment_kind_check
    CHECK (payment_kind IN ('payment', 'change')),
  ADD CONSTRAINT rental_payment_splits_amount_bs_sign_check
    CHECK (
      (payment_kind = 'payment' AND amount_bs >= 0)
      OR (payment_kind = 'change' AND amount_bs <= 0)
    ),
  ADD CONSTRAINT rental_payment_splits_amount_usd_sign_check
    CHECK (
      amount_usd IS NULL
      OR (payment_kind = 'payment' AND amount_usd >= 0)
      OR (payment_kind = 'change' AND amount_usd <= 0)
    );

COMMENT ON COLUMN public.sale_payment_splits.payment_kind IS
  'payment = monto recibido; change = vuelto entregado (amount_bs <= 0).';
COMMENT ON COLUMN public.rental_payment_splits.payment_kind IS
  'payment = monto recibido; change = vuelto entregado (amount_bs <= 0).';

-- No new constraint enforcing sum(amount_bs) = parent total: that needs a
-- deferred trigger, and per apps/web-app/docs/pago-mixto-db-contract.md the
-- sum invariant is validated in the frontend write path.
-- No new index: payment_kind has cardinality 2 and is never queried as a
-- standalone predicate; the existing idx_*_payment_splits_*_id indexes
-- already cover the access pattern.
-- RLS is unchanged: both tables already use USING (true) WITH CHECK (true).
