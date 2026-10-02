import { delayRoute } from '../support/bugs/networkFaults';
import { waitForSaleByMarker } from '../support/dbPolling';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { createRunMarker } from '../support/runMarker';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

test(
  'what you type in the edit-sale sheet survives the form loading',
  documented({
    titulo:
      '[B10 corregido] Lo que escribes en la edición de una venta no se borra al cargar el formulario',
    area: 'Ventas de agua',
    intent:
      'Comprobar que el subtotal que el usuario escribe justo después de abrir la edición de una venta no vuelve al valor anterior.',
    steps: [
      'Registra una venta de Bs 1000 y retrasa 3 segundos la respuesta de las propinas.',
      'Abre la edición de la venta y escribe 1500 en el subtotal.',
      'Espera a que termine de cargar el formulario.',
    ],
    expects: ['El subtotal sigue en 1500.'],
    data: 'Venta de Bs 1000 en efectivo, sin propina; respuesta de propinas retrasada 3 s.',
  }),
  async ({ page }) => {
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
