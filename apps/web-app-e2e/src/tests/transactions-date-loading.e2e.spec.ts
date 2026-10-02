import { lastDayOfPreviousMonth, todayVe } from '../support/bugs/dates';
import { seedExpense, seedSales } from '../support/bugs/dbSeed';
import { goToDate } from '../support/bugs/setup';
import { documented, expect, test } from '../support/fixtures';
import {
  gotoDashboard,
  openTransactionsFromMenu,
} from '../support/uiNavigation';

test(
  'Transactions loads the data of a date outside the loaded month',
  documented({
    titulo:
      '[FIN-06 corregido] Transacciones carga los movimientos de un día del mes anterior',
    area: 'Transacciones',
    intent:
      'Comprobar que al navegar a un día del mes anterior Transacciones trae sus movimientos.',
    steps: [
      'Siembra una venta y un egreso del último día del mes anterior.',
      'Abre Transacciones y navega hasta ese día.',
    ],
    expects: ['Aparecen 2 movimientos.'],
    data: 'Venta de Bs 100 y egreso de Bs 20 del último día del mes anterior.',
  }),
  async ({ page }) => {
    // Arrange
    const day = lastDayOfPreviousMonth(todayVe());
    await seedSales([{ date: day, dailyNumber: 1, totalBs: 100 }]);
    await seedExpense({ date: day, amount: 20 });
    await gotoDashboard(page);
    await openTransactionsFromMenu(page);

    // Act
    await goToDate(page, day);

    // Assert
    await expect(page.locator('[data-testid^="transaction-row-"]')).toHaveCount(
      2,
      { timeout: 8_000 }
    );
  }
);
