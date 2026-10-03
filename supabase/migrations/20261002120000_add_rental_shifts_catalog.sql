-- Rollback: DROP TABLE IF EXISTS public.rental_shifts;

CREATE TABLE IF NOT EXISTS public.rental_shifts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  label text NOT NULL,
  price_usd numeric NOT NULL CHECK (price_usd >= 0),
  hours integer NOT NULL CHECK (hours > 0),
  divisa_discount_usd numeric NOT NULL DEFAULT 0
    CHECK (divisa_discount_usd >= 0 AND divisa_discount_usd <= price_usd),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.rental_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on rental_shifts" ON public.rental_shifts;
CREATE POLICY "Allow all on rental_shifts"
  ON public.rental_shifts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

INSERT INTO public.rental_shifts
  (id, label, price_usd, hours, divisa_discount_usd)
VALUES
  ('medio', 'Medio Turno', 4, 8, 0),
  ('completo', 'Completo', 6, 24, 1),
  ('doble', 'Doble', 12, 48, 0)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS rental_shifts_active_idx
  ON public.rental_shifts (label)
  WHERE is_active = true AND deleted_at IS NULL;
