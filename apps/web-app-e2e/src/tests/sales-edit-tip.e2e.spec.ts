import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { waitForSaleByMarker } from '../support/dbPolling';
import { documented, expect, test } from '../support/fixtures';
import { createRunMarker } from '../support/runMarker';
import { listSaleSplitsBySaleIds } from '../support/supabaseClient';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

test(
  'editing a sale with a tip and saving unchanged keeps its splits',
  documented({
    titulo:
      '[B3 corregido] Editar y guardar sin cambios una venta con propina no mueve los métodos',
    area: 'Ventas de agua',
    intent:
      'Comprobar que abrir la edición de una venta con propina en otro método y guardar sin tocar nada deja intactos sus pagos.',
    steps: [
      'Registra una venta de Bs 1000 pagada en efectivo con propina de Bs 200 capturada en pago móvil.',
      'Lee cómo quedó repartido el pago en la base.',
      'Abre la edición de la venta y pulsa «Guardar Cambios» sin cambiar nada.',
      'Vuelve a leer el reparto.',
    ],
    expects: [
      'Antes y después el reparto es el mismo: efectivo 1000 y pago móvil 200.',
    ],
    data: 'Venta de Bs 1000 en efectivo; propina de Bs 200 en pago móvil.',
  }),
  async ({ page }) => {
    // Arrange
    const marker = createRunMarker();
    await bootstrapAtDashboard(page);
    await createWaterSale(page, {
      basePriceBs: 1000,
      splits: [{ method: 'efectivo', amountBs: 1000 }],
      tip: { amountBs: 200, method: 'pago_movil', paid: false },
      noteMarker: marker.notesValue,
    });
    const sale = await waitForSaleByMarker(marker.notesValue);
    const snapshot = async () =>
      (await listSaleSplitsBySaleIds([sale.id]))
        .map(({ paymentMethod, amountBs }) => ({ paymentMethod, amountBs }))
        .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
    const before = await snapshot();

    // Act
    await page.getByTestId(`sale-edit-trigger-${sale.id}`).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText(/Editar Venta/)).toBeVisible();
    await page.waitForTimeout(1_500); // let the tip hydrate into the form
    await sheet.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(sheet).toBeHidden({ timeout: 15_000 });

    // Assert
    expect(before).toEqual([
      { paymentMethod: 'efectivo', amountBs: 1000 },
      { paymentMethod: 'pago_movil', amountBs: 200 },
    ]);
    await expect.poll(snapshot, { timeout: 5_000 }).toEqual(before);
  }
);
