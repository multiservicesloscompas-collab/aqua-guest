import { expect, test, type Page } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { getSupabaseClient } from '../../support/supabaseClient';
import {
  createBalanceTransfer,
  openPaymentBalancePage,
} from '../../support/drivers/balanceDriver';
import { captureDashboardSnapshot } from '../../support/drivers/dashboardDriver';
import {
  createExpense,
  openExpensesModule,
} from '../../support/drivers/expenseDriver';
import { createWaterSale } from '../../support/drivers/waterSaleDriver';
import { parseUniversalMoney } from '../../support/money';
import {
  gotoDashboard,
  openTransactionsFromMenu,
} from '../../support/uiNavigation';
import {
  addDays,
  lastDayOfPreviousMonth,
  todayVe,
} from '../../support/bugs/dates';
import {
  firstMachineId,
  seedExpense,
  seedRental,
  seedSales,
  setExchangeRate,
} from '../../support/bugs/dbSeed';
import {
  goToDate,
  snapshotTodayRate,
  useCleanDomain,
} from '../../support/bugs/setup';

useCleanDomain();

const TODAY = () => todayVe();

async function transactionsTotal(
  page: Page,
  label: 'Ingresos' | 'Egresos'
): Promise<number> {
  const text = await page
    .getByText(label, { exact: true })
    .locator('xpath=following-sibling::p')
    .first()
    .innerText();
  return parseUniversalMoney(text);
}

async function balanceAmount(
  page: Page,
  label: string,
  field: 'Original' | 'final'
): Promise<number> {
  const row = page
    .locator('div.rounded-xl.border', {
      has: page.getByText(label, { exact: true }),
    })
    .first();
  await expect(row).toBeVisible();
  if (field === 'Original') {
    return parseUniversalMoney(
      await row.locator('p', { hasText: 'Original:' }).first().innerText()
    );
  }
  return parseUniversalMoney(
    await row.locator('p.font-bold').first().innerText()
  );
}

async function seedPaidRentalWithSplit(opts: {
  date: string;
  datePaid: string;
  amountBs: number;
  amountUsd: number;
  rateUsed: number;
}): Promise<string> {
  const id = await seedRental({
    date: opts.date,
    machineId: await firstMachineId(),
    shift: 'completo',
    deliveryTime: '09:00',
    pickupDate: addDays(opts.date, 1),
    pickupTime: '09:00',
    totalUsd: opts.amountUsd,
    isPaid: true,
    datePaid: opts.datePaid,
  });
  const { error } = await getSupabaseClient()
    .from('rental_payment_splits')
    .insert({
      rental_id: id,
      payment_method: 'efectivo',
      amount_bs: opts.amountBs,
      amount_usd: opts.amountUsd,
      exchange_rate_used: opts.rateUsed,
    });
  if (error) throw new Error(error.message);
  return id;
}

test.describe('FIN · consistencia financiera (rojos)', () => {
  test(
    '[FIN-01] alquiler pagado no cambia de monto cuando cambia la tasa',
    bugDoc({
      id: 'FIN-01',
      titulo: 'Un alquiler pagado no cambia de monto si cambia la tasa',
      intent:
        'Comprobar que el ingreso de un alquiler ya pagado conserva su monto histórico cuando cambia la tasa del día (bug B5).',
      steps: [
        'Siembra un alquiler de $5 pagado con tasa 36.5 (Bs 182.50).',
        'Cambia la tasa de hoy a 50.',
        'Lee las tarjetas y el ingreso del dashboard y el ingreso de Transacciones.',
      ],
      expects: [
        'Las tarjetas por método suman Bs 182.50.',
        'El ingreso del dashboard es Bs 182.50.',
        'El ingreso de Transacciones es Bs 182.50.',
      ],
      actual:
        'el dashboard convierte el alquiler con la tasa de hoy y muestra Bs 250',
    }),
    async ({ page }) => {
      const restore = await snapshotTodayRate();
      try {
        // Arrange: $5 rental paid at rate 36.5 (Bs 182.50), then the rate moves to 50
        await setExchangeRate(TODAY(), 36.5);
        await seedPaidRentalWithSplit({
          date: TODAY(),
          datePaid: TODAY(),
          amountBs: 182.5,
          amountUsd: 5,
          rateUsed: 36.5,
        });
        await setExchangeRate(TODAY(), 50);

        // Act
        await gotoDashboard(page);
        const snapshot = await captureDashboardSnapshot(page);
        const cardsTotal = Object.values(snapshot.methodTotals).reduce(
          (a, b) => a + b,
          0
        );
        await openTransactionsFromMenu(page);
        const txIncome = await transactionsTotal(page, 'Ingresos');

        // Assert: every view reports the historical Bs 182.50
        expect(cardsTotal).toBeCloseTo(182.5, 1);
        expect(snapshot.mtdIncomeBs).toBeCloseTo(182.5, 0);
        expect(txIncome).toBeCloseTo(182.5, 1);
      } finally {
        await restore();
      }
    }
  );

  test(
    '[FIN-02] Transacciones no cuenta una transferencia entre métodos como ingreso',
    bugDoc({
      id: 'FIN-02',
      titulo: 'Transacciones no cuenta un equilibrio como ingreso',
      intent:
        'Comprobar que mover dinero entre métodos no aumenta los ingresos que muestra Transacciones.',
      steps: [
        'Registra una venta de Bs 100 en efectivo.',
        'Hace un equilibrio de Bs 40 de efectivo a pago móvil.',
        'Compara el ingreso del dashboard con el de Transacciones.',
      ],
      expects: [
        'El ingreso de Transacciones es igual al del dashboard (Bs 100).',
      ],
      actual:
        'Transacciones suma la entrada del equilibrio como ingreso y muestra Bs 140',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 100,
        splits: [{ method: 'efectivo', amountBs: 100 }],
        noteMarker: 'E2E-BUG-FIN02',
      });
      await createBalanceTransfer(page, {
        operationType: 'equilibrio',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOutBs: 40,
        amountInBs: 40,
      });

      const snapshot = await captureDashboardSnapshot(page);
      await openTransactionsFromMenu(page);
      const txIncome = await transactionsTotal(page, 'Ingresos');

      expect(txIncome).toBeCloseTo(snapshot.mtdIncomeBs, 0);
    }
  );

  test(
    '[FIN-03] el resumen de Equilibrio se actualiza tras registrar una transferencia',
    bugDoc({
      id: 'FIN-03',
      titulo: 'El resumen de Equilibrio se actualiza tras una transferencia',
      intent:
        'Comprobar que el total final de Efectivo en Equilibrio baja apenas se registra una transferencia.',
      steps: [
        'Registra una venta de Bs 100 en efectivo.',
        'Abre Equilibrio y lee el total final de Efectivo.',
        'Transfiere Bs 50 de efectivo a pago móvil.',
      ],
      expects: ['El total final de Efectivo pasa de Bs 100 a Bs 50.'],
      actual: 'el resumen no se recalcula y sigue en Bs 100',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 100,
        splits: [{ method: 'efectivo', amountBs: 100 }],
        noteMarker: 'E2E-BUG-FIN03',
      });
      await openPaymentBalancePage(page);
      const before = await balanceAmount(page, 'Efectivo', 'final');

      await createBalanceTransfer(page, {
        operationType: 'equilibrio',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOutBs: 50,
        amountInBs: 50,
      });

      await expect
        .poll(() => balanceAmount(page, 'Efectivo', 'final'), {
          timeout: 5_000,
        })
        .toBeCloseTo(before - 50, 1);
    }
  );

  test(
    '[FIN-04] un alquiler pagado mañana no aparece hoy en Equilibrio',
    bugDoc({
      id: 'FIN-04',
      titulo: 'Un alquiler pagado mañana no aparece hoy en Equilibrio',
      intent:
        'Comprobar que Equilibrio usa la fecha de pago del alquiler, igual que el dashboard.',
      steps: [
        'Siembra un alquiler de $6 (Bs 240) cuyo pago es de mañana.',
        'Abre Equilibrio y lee el original de Efectivo.',
      ],
      expects: ['El original de Efectivo hoy es Bs 0.'],
      actual: 'Equilibrio usa la fecha del servicio y muestra Bs 240',
    }),
    async ({ page }) => {
      await seedPaidRentalWithSplit({
        date: TODAY(),
        datePaid: addDays(TODAY(), 1),
        amountBs: 240,
        amountUsd: 6,
        rateUsed: 40,
      });

      await gotoDashboard(page);
      await openPaymentBalancePage(page);
      const original = await balanceAmount(page, 'Efectivo', 'Original');

      expect(original).toBe(0);
    }
  );

  test(
    '[FIN-05] el total final de Equilibrio descuenta egresos igual que el Dashboard',
    bugDoc({
      id: 'FIN-05',
      titulo:
        'El total final de Equilibrio descuenta egresos como el dashboard',
      intent:
        'Comprobar que Equilibrio y la tarjeta de Efectivo del dashboard dan el mismo saldo.',
      steps: [
        'Registra una venta de Bs 100 en efectivo y un egreso de Bs 30 en efectivo.',
        'Lee la tarjeta de Efectivo del dashboard y el total final de Equilibrio.',
      ],
      expects: ['Equilibrio muestra Bs 70, igual que la tarjeta de Efectivo.'],
      actual: 'Equilibrio ignora egresos y pagos de propina y muestra Bs 100',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 100,
        splits: [{ method: 'efectivo', amountBs: 100 }],
        noteMarker: 'E2E-BUG-FIN05',
      });
      await createExpense(page, {
        description: 'E2E-BUG gasto',
        amountBs: 30,
        category: 'otros',
        splits: [{ method: 'efectivo', amountBs: 30 }],
      });
      const snapshot = await captureDashboardSnapshot(page);

      await openPaymentBalancePage(page);
      const balanceFinal = await balanceAmount(page, 'Efectivo', 'final');

      expect(balanceFinal).toBeCloseTo(snapshot.methodTotals.efectivo, 1);
    }
  );

  test(
    '[FIN-06] Transacciones carga datos del mes anterior al navegar la fecha',
    bugDoc({
      id: 'FIN-06',
      titulo: 'Transacciones carga el mes anterior al navegar la fecha',
      intent:
        'Comprobar que al navegar a un día del mes anterior Transacciones trae sus movimientos.',
      steps: [
        'Siembra una venta y un egreso del último día del mes anterior.',
        'Abre Transacciones y navega hasta ese día.',
      ],
      expects: ['Aparecen 2 movimientos.'],
      actual: 'la pantalla no pide esos datos y solo aparece 1 movimiento',
    }),
    async ({ page }) => {
      const day = lastDayOfPreviousMonth(TODAY());
      await seedSales([{ date: day, dailyNumber: 1, totalBs: 100 }]);
      await seedExpense({ date: day, amount: 20 });

      await gotoDashboard(page);
      await openTransactionsFromMenu(page);
      await goToDate(page, day);

      await expect(
        page.locator('[data-testid^="transaction-row-"]')
      ).toHaveCount(2, { timeout: 8_000 });
    }
  );
});

test.describe('FIN · egresos y validaciones (rojos)', () => {
  test(
    '[FIN-09] Métricas de Egresos solo suma el día/periodo seleccionado',
    bugDoc({
      id: 'FIN-09',
      titulo: 'Métricas de Egresos solo suma el período seleccionado',
      intent:
        'Comprobar que las métricas de egresos de hoy no incluyen egresos de otros días cargados.',
      steps: [
        'Siembra un egreso de Bs 30 hoy y otro de Bs 20 del mes anterior.',
        'Navega al mes anterior para cargarlo, vuelve a hoy y abre Métricas Egresos.',
      ],
      expects: ['Total Bs muestra Bs 30.00.'],
      actual: 'la pantalla suma todo lo cargado y muestra Bs 50.00',
    }),
    async ({ page }) => {
      const past = lastDayOfPreviousMonth(TODAY());
      await seedExpense({ date: TODAY(), amount: 30 });
      await seedExpense({ date: past, amount: 20 });

      await gotoDashboard(page);
      await openExpensesModule(page);
      await goToDate(page, past); // loads the previous-month expense into the shared store
      await page.getByTestId('water-sales-current-date').first().click(); // back to today
      await page.getByLabel('Abrir submenú del módulo').click();
      await page.getByLabel('Ir a Métricas Egresos').click();

      await expect(page.getByText('Total Bs')).toBeVisible();
      await expect(page.getByText('Bs 30.00')).toBeVisible({ timeout: 8_000 });
    }
  );

  test(
    '[FIN-10] un gasto con monto 0 no se registra',
    bugDoc({
      id: 'FIN-10',
      titulo: 'Un egreso de monto 0 no se registra',
      intent:
        'Comprobar que el formulario no permite guardar un egreso de Bs 0.',
      steps: [
        'Abre Egresos, escribe monto 0 y una descripción.',
        'Intenta guardar.',
      ],
      expects: ['No se crea ningún egreso.'],
      actual: 'solo se valida que el campo no esté vacío y se crea 1 egreso',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await page.getByLabel('Abrir más opciones').click();
      await page.getByLabel('Ir a Egresos').click();
      await page.getByTestId('expenses-add-fab').click();
      await page.locator('input[type="number"]').first().fill('0');
      await page.getByPlaceholder('Ej: Compra de insumos').fill('E2E-BUG cero');

      const submit = page.getByTestId('expense-submit-button');
      if (await submit.isEnabled()) await submit.click();
      await page.waitForTimeout(1_500);

      const { count } = await getSupabaseClient()
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('description', 'E2E-BUG cero');
      expect(count).toBe(0);
    }
  );

  test(
    '[FIN-11] una transferencia mayor al saldo disponible se bloquea',
    bugDoc({
      id: 'FIN-11',
      titulo: 'Una transferencia mayor al saldo disponible se bloquea',
      intent:
        'Comprobar que no se puede mover más dinero del que hay en un método.',
      steps: [
        'Abre Equilibrio con saldo 0 en Efectivo.',
        'Intenta transferir Bs 1.000.000 de efectivo a pago móvil.',
      ],
      expects: ['No se crea ninguna transferencia.'],
      actual: 'no se valida el saldo y la transferencia se crea',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await openPaymentBalancePage(page);
      const before = await balanceAmount(page, 'Efectivo', 'final');
      expect(before).toBe(0);

      await createBalanceTransfer(page, {
        operationType: 'equilibrio',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amountOutBs: 1_000_000,
        amountInBs: 1_000_000,
      }).catch(() => undefined);

      const { count } = await getSupabaseClient()
        .from('payment_balance_transactions')
        .select('id', { count: 'exact', head: true });
      expect(count).toBe(0);
    }
  );

  test(
    '[FIN-12] Neto Mes includes expenses of earlier days of the month',
    bugDoc({
      id: 'FIN-12',
      titulo: 'El neto del mes descuenta los egresos de días anteriores',
      intent:
        'Comprobar que, al abrir la app, «Neto Mes» resta los egresos de todo el mes y no solo los de los días ya visitados.',
      steps: [
        'Siembra una venta de Bs 2000 y un egreso de Bs 500 de ayer (mismo mes).',
        'Abre el dashboard de hoy sin visitar antes ningún otro día.',
      ],
      expects: ['Acumulado Mes muestra Bs 2000 y Neto Mes muestra Bs 1500.'],
      actual:
        'el dashboard carga las ventas de todo el mes pero no los egresos, así que Neto Mes muestra Bs 2000 hasta que se visita ese día en Egresos',
    }),
    async ({ page }) => {
      // Arrange
      const today = todayVe();
      test.skip(today.endsWith('-01'), 'Yesterday falls in the previous month');
      const yesterday = addDays(today, -1);
      await seedSales([
        { date: yesterday, dailyNumber: 1, totalBs: 2000, exchangeRate: 1000 },
      ]);
      await seedExpense({ date: yesterday, amount: 500 });

      // Act
      await gotoDashboard(page);
      await page.waitForTimeout(2_000);
      const snapshot = await captureDashboardSnapshot(page);

      // Assert
      expect(snapshot.mtdIncomeBs).toBe(2000);
      expect(snapshot.mtdNetBs).toBe(1500);
    }
  );
});
