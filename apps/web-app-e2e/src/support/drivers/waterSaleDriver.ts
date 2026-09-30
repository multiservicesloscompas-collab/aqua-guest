import { expect, type Page } from '@playwright/test';
import { TOAST_SALE_REGISTERED, expectToast } from '../toasts';
import { openWaterSalesFromBottomNav } from '../uiNavigation';
import type {
  SupportedPaymentMethod,
  WaterSaleInput,
} from '../masterLedger/ledgerTypes';

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisa',
} as const;

export async function selectBottleProduct(
  page: Page,
  customPrice?: number
): Promise<void> {
  const addProductFab = page.getByTestId('water-sales-add-product-fab');
  await expect(addProductFab).toBeVisible();
  await addProductFab.click();

  await expect(
    page.getByRole('heading', { name: 'Agregar Producto' })
  ).toBeVisible();

  const optionByTestId = page.getByTestId('add-product-option-botellon');
  const optionByName = page.getByRole('button', { name: /botell/i }).first();

  await expect
    .poll(
      async () => (await optionByTestId.count()) + (await optionByName.count()),
      { timeout: 10_000 }
    )
    .toBeGreaterThan(0);

  const bottleOption =
    (await optionByTestId.count()) > 0 ? optionByTestId.first() : optionByName;
  await bottleOption.click();

  if (customPrice !== undefined) {
    const priceInput = page.locator('input[type="number"]').first();
    await expect(priceInput).toBeVisible();
    await priceInput.fill(customPrice.toString());
  }

  const confirmAddButton = page.getByTestId('add-product-confirm');
  await expect(confirmAddButton).toBeVisible();
  await expect(confirmAddButton).toBeEnabled();
  await confirmAddButton.click();
}

export async function createWaterSale(
  page: Page,
  input: WaterSaleInput
): Promise<void> {
  await openWaterSalesFromBottomNav(page);
  await selectBottleProduct(page, input.basePriceBs);

  await page.getByTestId('water-sales-open-cart-mobile').click();

  const primarySplit = input.splits[0];
  await page.getByTestId(`cart-payment-method-${primarySplit.method}`).click();

  if (input.splits.length > 1) {
    const secondarySplit = input.splits[1];
    const toggle = page.getByTestId('mixed-payment-toggle');
    await toggle.click();

    const amountInput = page.locator('#mixed-payment-amount-input');
    await expect(amountInput).toBeVisible();
    await amountInput.fill(secondarySplit.amountBs.toString());

    const secondaryLabel = METHOD_LABELS[secondarySplit.method];
    await page.getByLabel(`Método secundario ${secondaryLabel}`).click();
  }

  if (input.tip && input.tip.amountBs > 0) {
    await page.getByTestId('cart-tip-toggle').click();
    await page
      .getByTestId('cart-tip-amount-input')
      .fill(input.tip.amountBs.toString());

    if (input.tip.method) {
      await page
        .getByTestId(`cart-tip-payment-method-${input.tip.method}`)
        .click();
    }
  }

  await page.getByTestId('cart-notes-input').fill(input.noteMarker);
  await page.getByTestId('cart-confirm-sale').click();

  await expectToast(page, TOAST_SALE_REGISTERED, { timeout: 10_000 });
}

/** Deletes today's sale from the Agua list with its trash button and the confirm drawer. */
export async function deleteWaterSale(
  page: Page,
  saleId: string
): Promise<void> {
  await openWaterSalesFromBottomNav(page);
  const row = page.getByTestId(`sale-row-${saleId}`);
  await expect(row).toBeVisible({ timeout: 10_000 });

  await page.getByTestId(`sale-delete-trigger-${saleId}`).click();
  const confirm = page.getByTestId('sale-delete-confirm');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(row).toHaveCount(0);
}

const EDIT_METHOD_LABEL: Record<SupportedPaymentMethod, string> = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisa',
};

/** Edits today's sale from the Agua list: new subtotal and/or new payment method. */
export async function editWaterSale(
  page: Page,
  saleId: string,
  changes: { baseBs?: number; primary?: SupportedPaymentMethod }
): Promise<void> {
  await openWaterSalesFromBottomNav(page);
  await page.getByTestId(`sale-edit-trigger-${saleId}`).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText(/Editar Venta/)).toBeVisible();

  if (changes.baseBs !== undefined) {
    await sheet
      .locator('input[type="number"]')
      .first()
      .fill(String(changes.baseBs));
  }
  if (changes.primary) {
    await sheet.getByRole('combobox').first().click();
    await page
      .getByRole('option', { name: EDIT_METHOD_LABEL[changes.primary] })
      .click();
  }
  await sheet.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(sheet).toBeHidden({ timeout: 15_000 });
}
