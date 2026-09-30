import { expect, type Page } from '@playwright/test';
import type { WasherRentalInput } from '../masterLedger/ledgerTypes';

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisas',
} as const;

export async function openRentalsModule(page: Page): Promise<void> {
  await page.getByLabel('Ir a Lavadoras').click();
  await expect(
    page.getByRole('heading', { name: 'Alquiler de Lavadoras' })
  ).toBeVisible({ timeout: 10_000 });
}

export async function createWasherRental(
  page: Page,
  input: WasherRentalInput
): Promise<void> {
  await openRentalsModule(page);

  const addFab = page.getByTestId('rentals-add-fab');
  await expect(addFab).toBeVisible();
  await addFab.click();

  await expect(
    page.getByRole('heading', { name: 'Nuevo Alquiler' })
  ).toBeVisible();

  // 1. Select first available machine in the selector
  const machineButton = page
    .locator('[data-testid="rental-machine-selector"] button:not([disabled])')
    .first();
  await expect(machineButton).toBeVisible();
  await machineButton.click();

  // 2. Select shift
  let shiftMatcher: RegExp;
  if (input.shift === 'medio') {
    shiftMatcher = /medio/i;
  } else if (input.shift === 'doble') {
    shiftMatcher = /doble/i;
  } else if (input.shift === 'completo') {
    shiftMatcher = /completo/i;
  } else {
    shiftMatcher = new RegExp(input.shift, 'i');
  }
  const shiftButton = page.getByRole('button', { name: shiftMatcher }).first();
  await expect(shiftButton).toBeVisible();
  await shiftButton.click();

  // 3. Delivery fee if specified
  if (input.deliveryFeeUsd !== undefined && input.deliveryFeeUsd > 0) {
    const feeButton = page.getByRole('button', {
      name: `$${input.deliveryFeeUsd}`,
      exact: true,
    });
    if (await feeButton.isVisible()) {
      await feeButton.click();
    }
  }

  // 4. Payment method and splits
  const primaryMethod = input.splits[0].method;
  await page.getByTestId(`rental-payment-method-${primaryMethod}`).click();

  if (input.splits.length > 1) {
    const mixedToggle = page.getByTestId('mixed-payment-toggle');
    await mixedToggle.click();

    const amountInput = page.locator('#mixed-payment-amount-input');
    await expect(amountInput).toBeVisible();
    await amountInput.fill(input.splits[1].amountBs.toString());

    // Select secondary method button (grid variant)
    const secondaryMethod = input.splits[1].method;
    const secondaryLabel = METHOD_LABELS[secondaryMethod];
    await page.getByLabel(`Método secundario ${secondaryLabel}`).click();
  }

  // 5. Payment status (paid vs pending)
  if (input.isPaid) {
    const statusSelect = page.getByTestId('rental-payment-status-select');
    await statusSelect.click();
    await page.getByRole('option', { name: 'Pagado' }).click();
  }

  // 6. Customer info
  await page.getByRole('button', { name: /cliente/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Seleccionar Cliente' })
  ).toBeVisible();

  await page
    .getByPlaceholder('Nombre del cliente')
    .fill(input.customerName);
  await page
    .getByPlaceholder('Dirección de entrega')
    .fill('Calle Prueba #100');

  await page.getByRole('button', { name: 'Aplicar y Continuar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Seleccionar Cliente' })
  ).toBeHidden();

  // 7. Confirm rental
  const confirmBtn = page.getByTestId('rental-confirm-button');
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  await expect(
    page.getByRole('heading', { name: 'Nuevo Alquiler' })
  ).toBeHidden({ timeout: 15_000 });
}

export async function toggleRentalPayment(
  page: Page,
  customerName: string,
  markAsPaid: boolean
): Promise<void> {
  await openRentalsModule(page);

  const card = page.locator('.bg-card', { hasText: customerName }).first();
  await expect(card).toBeVisible();

  const paymentBtn = card.getByRole('button', {
    name: markAsPaid ? 'Pendiente' : 'Pagado',
  });
  await paymentBtn.click();

  if (markAsPaid) {
    const confirmBtn = page.getByRole('button', {
      name: 'Confirmar y Guardar',
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
  } else {
    const confirmBtn = page.getByRole('button', {
      name: 'Confirmar como Pendiente',
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
  }

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
}
