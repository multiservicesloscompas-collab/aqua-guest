import { type Page } from '@playwright/test';
import { documented, expect, test } from '../support/fixtures';
import { TOAST_SALE_REGISTERED, expectToast } from '../support/toasts';
import { waitForSaleByMarker } from '../support/dbPolling';
import { createRunMarker } from '../support/runMarker';
import {
  assertSaleStoredWithoutMixedOrTip,
  assertSimpleCheckoutGuards,
} from '../support/simpleSaleGuards';
import {
  gotoDashboard,
  openWaterSalesFromBottomNav,
} from '../support/uiNavigation';

async function addBottleToCart(page: Page) {
  const addProductFab = page.getByTestId('water-sales-add-product-fab');
  await expect(addProductFab).toBeVisible();
  await addProductFab.click();

  const optionByTestId = page.getByTestId('add-product-option-botellon');
  const optionByName = page.getByRole('button', { name: /botell/i }).first();

  await expect
    .poll(
      async () => (await optionByTestId.count()) + (await optionByName.count()),
      {
        timeout: 10_000,
        message: 'Bottle product option did not appear in add-product sheet',
      }
    )
    .toBeGreaterThan(0);

  const bottleOption =
    (await optionByTestId.count()) > 0 ? optionByTestId.first() : optionByName;

  await expect(bottleOption).toBeVisible();
  await bottleOption.click();

  const confirmAddButton = page.getByTestId('add-product-confirm');
  await expect(confirmAddButton).toBeVisible();
  await expect(confirmAddButton).toBeEnabled();
  await confirmAddButton.click();
}

test(
  'negative guard: mixed payment ON is rejected before simple-sale submit',
  documented({
    titulo: 'Una venta simple no sale con pago mixto encendido',
    area: 'Ventas de agua',
    intent:
      'Comprobar que una venta simple no puede salir con el pago mixto encendido.',
    steps: [
      'Abre Agua, agrega un botellón y abre el carrito.',
      'Enciende el pago mixto (aparece el campo del método secundario).',
      'Aplica la guarda del checkout simple.',
      'Escribe la nota y confirma la venta en efectivo.',
    ],
    expects: [
      'Tras la guarda el interruptor de pago mixto queda apagado y el campo del método secundario desaparece.',
      'No hay campo de propina.',
      'Aparece el aviso «¡Venta registrada correctamente!».',
      'La venta queda en efectivo, con la nota, sin splits ni propina.',
    ],
  }),
  async ({ page }) => {
    const marker = createRunMarker();

    await gotoDashboard(page);
    await openWaterSalesFromBottomNav(page);
    await addBottleToCart(page);

    await page.getByTestId('water-sales-open-cart-mobile').click();
    await expect(page.getByRole('heading', { name: /carrito/i })).toBeVisible();

    const mixedToggle = page.getByTestId('mixed-payment-toggle').first();
    await expect(mixedToggle).toBeVisible();
    await mixedToggle.click();
    await expect(mixedToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(mixedToggle).toHaveAttribute('data-state', 'on');
    await expect(page.getByLabel('Monto método secundario (Bs)')).toBeVisible();

    await assertSimpleCheckoutGuards(page, 'efectivo');

    await expect(mixedToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(mixedToggle).toHaveAttribute('data-state', 'off');
    await expect(page.getByLabel('Monto método secundario (Bs)')).toHaveCount(
      0
    );
    await expect(page.getByTestId('cart-tip-amount-input')).toHaveCount(0);

    await page.getByTestId('cart-notes-input').fill(marker.notesValue);
    await page.getByTestId('cart-confirm-sale').click();
    await expectToast(page, TOAST_SALE_REGISTERED);

    const sale = await waitForSaleByMarker(marker.id);
    expect(sale.paymentMethod).toBe('efectivo');
    expect(sale.notes).toBe(marker.notesValue);
    await assertSaleStoredWithoutMixedOrTip(sale.id, 'efectivo');
  }
);
