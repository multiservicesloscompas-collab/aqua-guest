import { expect, test } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { seedPendingTip, seedSales } from '../../support/bugs/dbSeed';
import { todayVe } from '../../support/bugs/dates';
import { useCleanDomain } from '../../support/bugs/setup';
import { openTipsModule } from '../../support/drivers/expenseDriver';
import { getSupabaseClient } from '../../support/supabaseClient';
import { bootstrapAtDashboard } from '../../support/waterSalesTipsMatrix/uiHelpers';

useCleanDomain();

test.describe('Propinas (rojos)', () => {
  test(
    '[B1] a tip deleted elsewhere disappears from the Tips page',
    bugDoc({
      id: 'B1',
      titulo: 'Una propina borrada deja de aparecer en Propinas',
      intent:
        'Comprobar que la pantalla de Propinas no sigue mostrando una propina que ya no existe en la base.',
      steps: [
        'Siembra una venta con una propina pendiente y abre Propinas (la propina aparece).',
        'Borra la propina directamente en la base.',
        'Sale de Propinas, vuelve a entrar y espera la recarga.',
      ],
      expects: ['La propina ya no aparece en la lista.'],
      actual:
        'la tienda de propinas mezcla lo nuevo con lo que ya tenía y nunca descarta las propinas borradas',
    }),
    async ({ page }) => {
      // Arrange
      const [saleId] = await seedSales([
        { date: todayVe(), dailyNumber: 1, totalBs: 1000 },
      ]);
      const tipId = await seedPendingTip({
        originId: saleId,
        originType: 'sale',
        tipDate: todayVe(),
        amountBs: 100,
      });
      await bootstrapAtDashboard(page);
      await openTipsModule(page);
      await expect(page.getByTestId(`tip-pay-button-${tipId}`)).toBeVisible();

      // Act
      await getSupabaseClient().from('tips').delete().eq('id', tipId);
      await page.getByLabel('Ir a Inicio').click();
      await openTipsModule(page);
      await page.waitForTimeout(2_000);

      // Assert
      await expect(page.getByTestId(`tip-pay-button-${tipId}`)).toHaveCount(0);
    }
  );
});
