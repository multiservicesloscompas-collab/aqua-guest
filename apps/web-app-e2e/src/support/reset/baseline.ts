/**
 * Data every e2e test starts from. The reset wipes the whole domain and then
 * inserts exactly this, so a test that deletes customers or machines does not
 * change what the next test sees.
 *
 * Values are e2e-only: they do not change the defaults the app ships with.
 */

/** Bs per USD. Integer amounts and this rate keep every USD figure exact. */
export const BASELINE_EXCHANGE_RATE = 1000;

/** Liter breakpoints in increasing order and increasing price (19 L = 700 Bs). */
export const BASELINE_LITER_PRICING = [
  { breakpoint: 2, price: 100 },
  { breakpoint: 5, price: 200 },
  { breakpoint: 8, price: 300 },
  { breakpoint: 12, price: 450 },
  { breakpoint: 15, price: 550 },
  { breakpoint: 19, price: 700 },
  { breakpoint: 24, price: 850 },
] as const;

export const BASELINE_PRODUCTS = [
  {
    name: 'Recarga de Agua',
    default_price: 700,
    min_liters: 1,
    max_liters: 24,
    requires_liters: true,
    icon: '💧',
  },
  {
    name: 'Botellón Nuevo',
    default_price: 3000,
    min_liters: null,
    max_liters: null,
    requires_liters: false,
    icon: '🫗',
  },
  {
    name: 'Tapa de Botellón',
    default_price: 40,
    min_liters: null,
    max_liters: null,
    requires_liters: false,
    icon: '🔵',
  },
  {
    name: 'Lavado profundo',
    default_price: 1800,
    min_liters: null,
    max_liters: null,
    requires_liters: false,
    icon: '🧼',
  },
  {
    name: 'Botella 600ml',
    default_price: 3,
    min_liters: null,
    max_liters: null,
    requires_liters: false,
    icon: '🍶',
  },
  {
    name: 'Bolsa de Hielo',
    default_price: 8,
    min_liters: null,
    max_liters: null,
    requires_liters: false,
    icon: '🧊',
  },
] as const;

/** `disponible` is the status the app understands (the DB default is not). */
export const BASELINE_MACHINES = [
  { name: 'Lavadora 1', kg: 10 },
  { name: 'Lavadora 2', kg: 12 },
  { name: 'Lavadora 3', kg: 14 },
  { name: 'Lavadora 4', kg: 16 },
  { name: 'Lavadora 5', kg: 18 },
].map((machine) => ({
  ...machine,
  brand: 'Standard',
  status: 'disponible',
  is_available: true,
}));

export const BASELINE_CUSTOMERS = [1, 2, 3, 4].map((n) => ({
  name: `Cliente Prueba ${n}`,
  phone: `0414-100000${n}`,
  address: `Calle Prueba ${n}`,
}));
