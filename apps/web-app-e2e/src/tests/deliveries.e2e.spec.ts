import type { Page } from '@playwright/test';
import { createWasherRental } from '../support/drivers/rentalDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';

async function openDeliveries(page: Page) {
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Entregas').click();
  await expect(page.getByTestId('deliveries-stat-total')).toBeVisible();
}

test(
  'deliveries screen counts only rentals with a delivery fee',
  documented({
    titulo: 'Entregas cuenta solo los alquileres con tarifa de entrega',
    area: 'Entregas',
    intent:
      'Comprobar las estadísticas de Entregas: total, ingresos por entrega y entregas sin pagar.',
    steps: [
      'Registra tres alquileres de medio turno: uno con entrega de $2 pagado, uno con entrega de $3 pendiente y uno sin entrega.',
      'Abre Entregas en la vista del día.',
    ],
    expects: [
      'El total de entregas es 2 (el alquiler sin tarifa no cuenta).',
      '«Ingresos» muestra $5.00: suma las tarifas de las dos entregas, estén pagadas o no.',
      'Hay 1 entrega no pagada y el monto no pagado es $3.00.',
    ],
    data: 'Tarifas: $2 pagada, $3 pendiente. Regla por confirmar: hoy «Ingresos» incluye lo no pagado; este test fija ese comportamiento actual.',
  }),
  async ({ page }) => {
    // Arrange
    const rental = (name: string, fee: number, isPaid: boolean) =>
      createWasherRental(page, {
        shift: 'medio',
        deliveryFeeUsd: fee,
        totalUsd: 0,
        isPaid,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        customerName: `${name} ${Date.now()}`,
      });
    await gotoDashboard(page);
    await rental('Entrega pagada', 2, true);
    await rental('Entrega pendiente', 3, false);
    await rental('Sin entrega', 0, true);

    // Act
    await openDeliveries(page);
    const read = (id: string) => page.getByTestId(id).innerText();

    // Assert
    await expect(page.getByTestId('deliveries-stat-total')).toHaveText('2');
    expect(await read('deliveries-stat-revenue')).toBe('$5.00');
    expect(await read('deliveries-stat-unpaid-count')).toBe('1');
    expect(await read('deliveries-stat-unpaid-amount')).toBe('$3.00');
  }
);
