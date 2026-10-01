import { todayVe } from '../support/bugs/dates';
import { seedExpense, seedSales } from '../support/bugs/dbSeed';
import { captureDashboardSnapshot } from '../support/drivers/dashboardDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';

test(
  'the dashboard keeps the month expenses when the global sync finishes late',
  documented({
    titulo:
      '[FIN-12 corregido] El dashboard no pierde los egresos del mes cuando la sincronización global termina tarde',
    area: 'Dashboard',
    intent:
      'Comprobar que, al abrir la app, «Neto Mes» resta los egresos aunque la sincronización global de arranque termine después de cargar el mes.',
    steps: [
      'Siembra una venta de Bs 2000 y un egreso de Bs 500 de hoy.',
      'Retrasa 2,5 segundos la consulta de ventas de la sincronización global.',
      'Abre el dashboard sin visitar Egresos.',
    ],
    expects: [
      'Acumulado Mes muestra Bs 2000.',
      'Neto Mes termina mostrando Bs 1500, sin entrar a Egresos.',
    ],
    data: 'Venta de Bs 2000 y egreso de Bs 500, ambos de hoy.',
  }),
  async ({ page }) => {
    // Arrange
    await seedSales([
      { date: todayVe(), dailyNumber: 1, totalBs: 2000, exchangeRate: 1000 },
    ]);
    await seedExpense({ date: todayVe(), amount: 500 });
    // Only the global sync (loadFromSupabase) asks for the latest 100 sales.
    await page.route(/\/rest\/v1\/sales\?.*limit=100/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_500));
      await route.continue();
    });

    // Act
    await gotoDashboard(page);

    // Assert
    await expect
      .poll(async () => (await captureDashboardSnapshot(page)).mtdNetBs, {
        timeout: 15_000,
        intervals: [500, 1_000],
      })
      .toBe(1500);
    expect((await captureDashboardSnapshot(page)).mtdIncomeBs).toBe(2000);
  }
);
