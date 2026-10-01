-- Local-only seed (applied by `npm run supabase:reset`) that mirrors the production baseline.
INSERT INTO public.products (name, default_price, min_liters, max_liters, requires_liters, icon) VALUES
  ('Recarga de Agua', 240, 1, 24, true, '💧'),
  ('Botellón Nuevo', 3000, NULL, NULL, false, '🫗'),
  ('Tapa de Botellón', 40, NULL, NULL, false, '🔵'),
  ('Lavado profundo', 1800, NULL, NULL, false, '🧼'),
  ('Botella 600ml', 3, NULL, NULL, false, '🍶'),
  ('Bolsa de Hielo', 8, NULL, NULL, false, '🧊');
INSERT INTO public.exchange_rates (date, rate) VALUES ((now() AT TIME ZONE 'America/Caracas')::date::text, 40)
  ON CONFLICT (date) DO NOTHING;
