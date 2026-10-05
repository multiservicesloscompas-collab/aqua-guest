-- Rollback: DROP INDEX IF EXISTS public.rental_shifts_code_key; ALTER TABLE public.rental_shifts DROP CONSTRAINT IF EXISTS rental_shifts_code_format, DROP COLUMN IF EXISTS code;

ALTER TABLE public.rental_shifts
  ADD COLUMN IF NOT EXISTS code text;

UPDATE public.rental_shifts
SET code = upper(id)
WHERE code IS NULL
  AND id IN ('medio', 'completo', 'doble');

UPDATE public.rental_shifts
SET code = 'SHIFT_' || upper(replace(id, '-', ''))
WHERE code IS NULL;

ALTER TABLE public.rental_shifts
  ALTER COLUMN code SET NOT NULL;

ALTER TABLE public.rental_shifts
  DROP CONSTRAINT IF EXISTS rental_shifts_code_format;

ALTER TABLE public.rental_shifts
  ADD CONSTRAINT rental_shifts_code_format
  CHECK (code ~ '^[A-Z][A-Z0-9_]*$');

CREATE UNIQUE INDEX IF NOT EXISTS rental_shifts_code_key
  ON public.rental_shifts (code);
