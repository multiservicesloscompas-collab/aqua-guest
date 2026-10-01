import {
  addDays,
  firstDayOfPreviousMonth,
  todayVe,
} from '../support/bugs/dates';
import { seedSales, setExchangeRate } from '../support/bugs/dbSeed';
import { captureDashboardSnapshot } from '../support/drivers/dashboardDriver';
import { createExpense } from '../support/drivers/expenseDriver';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

test(
  'month-to-date KPIs add previous days, day KPIs do not',
  documented({
    titulo: 'Los indicadores del mes suman días anteriores y los del día no',
    area: 'Dashboard',
    intent:
      'Comprobar la diferencia entre los indicadores del mes (ingresos y neto acumulados) y los del día (egresos, neto y transacciones).',
    steps: [
      'Siembra en la base una venta de Bs 2000 de ayer (mismo mes).',
      'Registra por la pantalla una venta de Bs 1000 y un egreso de Bs 300 de hoy.',
      'Lee los indicadores del dashboard.',
    ],
    expects: [
      'Ingresos del mes: Bs 3000 (ayer + hoy).',
      'Neto del mes: Bs 2700 (3000 menos el egreso de hoy de 300).',
      'Egresos del día: Bs 300 y neto del día Bs 700.',
      'Transacciones del día: 1 (solo la venta de hoy).',
    ],
    data: 'El navegador corre con el reloj fijo en el día 15 del mes anterior (mediodía de Caracas), así que ayer es siempre del mismo mes y el test corre todos los días. Los egresos de días anteriores del mes no se siembran: ver el bug FIN-12.',
  }),
  async ({ page }) => {
    // Arrange
    const today = firstDayOfPreviousMonth(todayVe()).replace(/-01$/, '-15');
    const yesterday = addDays(today, -1);
    await page.clock.setFixedTime(new Date(`${today}T12:00:00-04:00`));
    await setExchangeRate(today, 1000);
    await seedSales([
      { date: yesterday, dailyNumber: 1, totalBs: 2000, exchangeRate: 1000 },
    ]);
    await bootstrapAtDashboard(page);
    await createWaterSale(page, {
      basePriceBs: 1000,
      splits: [{ method: 'efectivo', amountBs: 1000 }],
      noteMarker: `E2E_MTD_${Date.now()}`,
    });
    await createExpense(page, {
      description: `Egreso MTD ${Date.now()}`,
      amountBs: 300,
      category: 'otros',
      splits: [{ method: 'efectivo', amountBs: 300 }],
    });

    // Act
    const snapshot = await captureDashboardSnapshot(page);

    // Assert
    expect(snapshot.mtdIncomeBs).toBe(3000);
    expect(snapshot.mtdNetBs).toBe(2700);
    expect(snapshot.dayExpensesBs).toBe(300);
    expect(snapshot.dayNetBs).toBe(700);
    expect(snapshot.transactionsCount).toBe(1);
  }
);
