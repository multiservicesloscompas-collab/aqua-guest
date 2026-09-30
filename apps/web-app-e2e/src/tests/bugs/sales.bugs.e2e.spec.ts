import { expect, test } from '@playwright/test';
import { waitForSaleByMarker } from '../../support/dbPolling';
import { bugDoc } from '../../support/bugs/ficha';
import { delayRoute } from '../../support/bugs/networkFaults';
import { bug, useCleanDomain } from '../../support/bugs/setup';
import { createWaterSale } from '../../support/drivers/waterSaleDriver';
import { createRunMarker } from '../../support/runMarker';
import { bootstrapAtDashboard } from '../../support/waterSalesTipsMatrix/uiHelpers';

useCleanDomain();

test.describe('Ventas (rojos)', () => {
  test(
    '[B10] what you type in the edit-sale sheet survives the form loading',
    bugDoc({
      id: 'B10',
      titulo:
        'Lo que escribes en la edición de una venta no se borra al cargar el formulario',
      intent:
        'Comprobar que el subtotal que el usuario escribe justo después de abrir la edición de una venta no vuelve al valor anterior.',
      steps: [
        'Registra una venta de Bs 1000 y retrasa 3 segundos la respuesta de las propinas.',
        'Abre la edición de la venta y escribe 1500 en el subtotal.',
        'Espera a que termine de cargar el formulario.',
      ],
      expects: ['El subtotal sigue en 1500.'],
      actual:
        'el formulario vuelve a cargarse cuando llega la propina y restaura el subtotal original (en pruebas sin retraso pasa en 5 de cada 8 aperturas)',
    }),
    async ({ page }) => {
      bug(
        'B10',
        'useEditSaleSheetViewModel.ts hydration effect (same class as B2)'
      );
      // Arrange
      const marker = createRunMarker();
      await bootstrapAtDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 1000,
        splits: [{ method: 'efectivo', amountBs: 1000 }],
        noteMarker: marker.notesValue,
      });
      const sale = await waitForSaleByMarker(marker.notesValue);
      await delayRoute(page, 'tips', 'GET', () => 3_000);

      // Act
      await page.getByTestId(`sale-edit-trigger-${sale.id}`).click();
      const input = page
        .getByRole('dialog')
        .locator('input[type="number"]')
        .first();
      await input.fill('1500');
      await page.waitForTimeout(5_000);

      // Assert
      await expect(input).toHaveValue('1500');
    }
  );
});
