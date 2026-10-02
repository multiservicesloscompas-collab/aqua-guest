import { expect, test, type Page } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { getSupabaseClient } from '../../support/supabaseClient';
import {
  balanceAmount,
  createBalanceTransfer,
  openPaymentBalancePage,
} from '../../support/drivers/balanceDriver';
import { captureDashboardSnapshot } from '../../support/drivers/dashboardDriver';
import { openExpensesModule } from '../../support/drivers/expenseDriver';
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
        // The KPI card shows whole bolívares, so the historical 182.50 reads 183
        expect(snapshot.mtdIncomeBs).toBe(Math.round(182.5));
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
});
