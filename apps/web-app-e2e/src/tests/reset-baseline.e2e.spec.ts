import { addDays, todayVe } from '../support/bugs/dates';
import { seedSales } from '../support/bugs/dbSeed';
import { documented, expect, test } from '../support/fixtures';
import {
  BASELINE_CUSTOMERS,
  BASELINE_EXCHANGE_RATE,
  BASELINE_LITER_PRICING,
  BASELINE_MACHINES,
  BASELINE_PRODUCTS,
} from '../support/reset/baseline';
import {
  DOMAIN_TABLES,
  countDomainRows,
  resetDomain,
  type DomainTable,
} from '../support/reset/resetDomain';
import { getSupabaseClient } from '../support/supabaseClient';

const SEEDED_TABLES: readonly DomainTable[] = [
  'customers',
  'washing_machines',
  'exchange_rates',
  'liter_pricing',
  'products',
];

const TRANSACTIONAL_TABLES = DOMAIN_TABLES.filter(
  (table) => !SEEDED_TABLES.includes(table)
);

async function expectBaseline() {
  const counts = await countDomainRows(getSupabaseClient());

  for (const table of TRANSACTIONAL_TABLES) {
    expect(counts[table], `${table} must be empty`).toBe(0);
  }
  expect(counts.customers).toBe(BASELINE_CUSTOMERS.length);
  expect(counts.washing_machines).toBe(BASELINE_MACHINES.length);
  expect(counts.products).toBe(BASELINE_PRODUCTS.length);
  expect(counts.liter_pricing).toBe(BASELINE_LITER_PRICING.length);
  expect(counts.exchange_rates).toBe(1);
}

test.describe('e2e database reset', () => {
  // The last test purges without seeding; leave the baseline behind so the
  // app is usable if someone opens it right after this spec.
  test.afterAll(async () => {
    await resetDomain({ seed: true });
  });

  test(
    'every test starts from the baseline and no transactional rows',
    documented({
      titulo: 'Cada test arranca desde la línea base',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar que cada test arranca desde la línea base exacta y sin movimientos.',
      steps: [
        'La fixture reinicia la base antes del test.',
        'Lee de la base la tasa de hoy, el precio de 19 L y las lavadoras.',
        'Cuenta las filas de las 15 tablas.',
      ],
      expects: [
        'Las tablas de movimientos (ventas, alquileres, egresos, propinas, prepagos, transferencias y sus splits) tienen 0 filas.',
        'Hay 4 clientes, 5 lavadoras, 6 productos, 7 precios por litros y 1 tasa.',
        'La tasa de hoy es 1000 y el precio de 19 L es 700.',
        'Las lavadoras se llaman Lavadora 1 a 5 y están en estado disponible.',
      ],
    }),
    async () => {
      // Arrange
      const supabase = getSupabaseClient();

      // Act
      const rate = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('date', todayVe())
        .single();
      const machines = await supabase
        .from('washing_machines')
        .select('name,status,is_available')
        .order('name');
      const price19 = await supabase
        .from('liter_pricing')
        .select('price')
        .eq('breakpoint', 19)
        .single();

      // Assert
      await expectBaseline();
      expect(Number(rate.data?.rate)).toBe(BASELINE_EXCHANGE_RATE);
      expect(Number(price19.data?.price)).toBe(700);
      expect(machines.data).toEqual(
        BASELINE_MACHINES.map(({ name, status, is_available }) => ({
          name,
          status,
          is_available,
        }))
      );
    }
  );

  test(
    'a reset repairs what a test left behind',
    documented({
      titulo: 'El reinicio repara lo que un test dejó sucio',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar que un reset devuelve la base a la línea base aunque un test la haya ensuciado.',
      steps: [
        'Siembra 2 ventas (una de hoy y una de ayer).',
        'Borra todos los clientes, añade una lavadora extra y cambia la tasa de hoy a 1.',
        'Ejecuta el reset con línea base.',
      ],
      expects: [
        'El informe vio 2 ventas, 0 clientes y 6 lavadoras antes de borrar.',
        'Después vuelve la línea base exacta: 0 movimientos, 4 clientes y 5 lavadoras.',
        'La tasa de hoy vuelve a 1000.',
      ],
    }),
    async () => {
      // Arrange: sales, no customers, an extra machine and a different rate
      const supabase = getSupabaseClient();
      await seedSales([
        { date: todayVe(), dailyNumber: 1, totalBs: 700, exchangeRate: 1000 },
        { date: addDays(todayVe(), -1), dailyNumber: 1, totalBs: 300 },
      ]);
      await supabase.from('customers').delete().not('id', 'is', null);
      await supabase
        .from('washing_machines')
        .insert({ name: 'Extra', kg: 99, status: 'disponible' });
      await supabase
        .from('exchange_rates')
        .update({ rate: 1 })
        .eq('date', todayVe());

      // Act
      const report = await resetDomain({ seed: true });

      // Assert
      expect(report.before.sales).toBe(2);
      expect(report.before.customers).toBe(0);
      expect(report.before.washing_machines).toBe(BASELINE_MACHINES.length + 1);
      await expectBaseline();
      const rate = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('date', todayVe())
        .single();
      expect(Number(rate.data?.rate)).toBe(BASELINE_EXCHANGE_RATE);
    }
  );

  test(
    'a dry run reports the rows and deletes nothing',
    documented({
      titulo: 'La simulación cuenta filas y no borra nada',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar que el modo simulación cuenta las filas pero no borra nada.',
      steps: ['Siembra 1 venta.', 'Ejecuta el reset en modo simulación.'],
      expects: [
        'El informe marca simulación y cuenta 1 venta antes y después.',
        'La venta sigue en la base.',
      ],
    }),
    async () => {
      // Arrange
      await seedSales([
        { date: todayVe(), dailyNumber: 1, totalBs: 700, exchangeRate: 1000 },
      ]);

      // Act
      const report = await resetDomain({ dryRun: true });

      // Assert
      expect(report.dryRun).toBe(true);
      expect(report.before.sales).toBe(1);
      expect(report.after.sales).toBe(1);
      const counts = await countDomainRows(getSupabaseClient());
      expect(counts.sales).toBe(1);
    }
  );

  test(
    'purge mode empties every table without seeding',
    documented({
      titulo: 'El vaciado deja la base en cero absoluto',
      area: 'Herramientas de prueba (internas)',
      intent: 'Comprobar que el modo purge deja la base en cero absoluto.',
      steps: ['Siembra 1 venta.', 'Ejecuta el reset sin línea base.'],
      expects: [
        'El informe indica que no sembró nada.',
        'Las 15 tablas quedan con 0 filas, incluidos clientes, lavadoras y productos.',
      ],
    }),
    async () => {
      // Arrange
      await seedSales([
        { date: todayVe(), dailyNumber: 1, totalBs: 700, exchangeRate: 1000 },
      ]);

      // Act
      const report = await resetDomain({ seed: false });

      // Assert
      expect(report.seeded).toBe(false);
      for (const table of DOMAIN_TABLES) {
        expect(report.after[table], `${table} must be empty`).toBe(0);
      }
    }
  );
});
