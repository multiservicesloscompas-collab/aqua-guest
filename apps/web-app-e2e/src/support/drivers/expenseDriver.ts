import { expect, type Page } from '@playwright/test';
import { expectToast } from '../toasts';
import type {
  ExpenseInput,
  SupportedPaymentMethod,
} from '../masterLedger/ledgerTypes';

const METHOD_LABELS: Record<SupportedPaymentMethod, string> = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisas',
};

export async function openExpensesModule(page: Page): Promise<void> {
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Egresos').click();
  await expect(page.getByRole('heading', { name: 'Egresos' })).toBeVisible({
    timeout: 10_000,
  });
}

export async function openTipsModule(page: Page): Promise<void> {
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Propinas').click();
  await expect(page.getByTestId('tips-summary-card')).toBeVisible({
    timeout: 10_000,
  });
}

export async function createExpense(
  page: Page,
  input: ExpenseInput
): Promise<void> {
  await openExpensesModule(page);

  const addFab = page.getByTestId('expenses-add-fab');
  await expect(addFab).toBeVisible();
  await addFab.click();

  await expect(
    page.getByRole('heading', { name: 'Registrar Egreso' })
  ).toBeVisible();

  // 1. Fill Amount
  const amountInput = page.locator('input[type="number"]').first();
  await amountInput.fill(input.amountBs.toString());

  // 2. Fill Description
  await page.getByPlaceholder('Ej: Compra de insumos').fill(input.description);

  // 3. Payment Method
  const primaryMethod = input.splits[0].method;
  const primaryLabel = METHOD_LABELS[primaryMethod];
  await page
    .getByRole('button', { name: `Método de pago ${primaryLabel}` })
    .click();

  if (input.splits.length > 1) {
    const secondarySplit = input.splits[1];
    const toggle = page.getByTestId('mixed-payment-toggle');
    await toggle.click();

    const mixedInput = page.locator('#mixed-payment-amount-input');
    await expect(mixedInput).toBeVisible();
    await mixedInput.fill(secondarySplit.amountBs.toString());

    const secondaryLabel = METHOD_LABELS[secondarySplit.method];
    await page
      .getByRole('button', { name: `Método secundario ${secondaryLabel}` })
      .click();
  }

  // 4. Submit
  const submitBtn = page.getByTestId('expense-submit-button');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await expectToast(page, 'Egreso registrado', { timeout: 10_000 });
}

export async function payPendingTip(
  page: Page,
  tipId: string,
  paymentMethod: SupportedPaymentMethod
): Promise<void> {
  await openTipsModule(page);

  const payBtn = page.getByTestId(`tip-pay-button-${tipId}`);
  await expect(payBtn).toBeVisible({ timeout: 10_000 });
  await payBtn.click();

  await page.getByTestId(`tip-payment-method-${paymentMethod}`).click();
  await page.getByRole('button', { name: 'Confirmar Pago' }).click();

  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 });
}
