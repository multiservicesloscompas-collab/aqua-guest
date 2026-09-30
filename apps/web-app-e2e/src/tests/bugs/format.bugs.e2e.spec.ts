import { expect, test } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { seedSales } from '../../support/bugs/dbSeed';
import { todayVe } from '../../support/bugs/dates';
import { useCleanDomain } from '../../support/bugs/setup';
import { parseUniversalMoney } from '../../support/money';
import {
  gotoDashboard,
  openTransactionsFromMenu,
} from '../../support/uiNavigation';

useCleanDomain();

test.describe('Formato de montos (rojos)', () => {
  test(
    '[C12] Transacciones shows Bs amounts with two decimals like the rest of the app',
    bugDoc({
      id: 'C12',
      titulo: 'Los totales de Transacciones se muestran con dos decimales',
      intent:
        'Comprobar que el ingreso de Transacciones usa el mismo formato de bolívares que el dashboard (siempre dos decimales). Falta confirmar con el usuario cuál es el formato correcto.',
      steps: [
        'Siembra una venta de Bs 100 de hoy.',
        'Lee el ingreso del dashboard y abre Transacciones.',
      ],
      expects: ['El ingreso de Transacciones se muestra como «Bs 100,00».'],
      actual:
        'Transacciones formatea sin opciones y muestra «Bs 100» (entre 0 y 3 decimales según el monto)',
    }),
    async ({ page }) => {
      // Arrange
      await seedSales([{ date: todayVe(), dailyNumber: 1, totalBs: 100 }]);
      await gotoDashboard(page);

      // Act
      await openTransactionsFromMenu(page);
      const text = await page
        .getByText('Ingresos', { exact: true })
        .locator('xpath=following-sibling::p')
        .first()
        .innerText();

      // Assert
      expect(parseUniversalMoney(text)).toBeCloseTo(100, 1);
      expect(text).toMatch(/,\d{2}$/);
    }
  );
});
