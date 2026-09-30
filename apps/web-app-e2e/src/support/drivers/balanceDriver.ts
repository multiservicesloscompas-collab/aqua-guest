import { expect, type Page } from '@playwright/test';
import { openDashboardFromBottomNav } from '../uiNavigation';
import type {
  BalanceTransferInput,
  SupportedPaymentMethod,
} from '../masterLedger/ledgerTypes';

const METHOD_LABELS: Record<SupportedPaymentMethod, string> = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisa',
};

export async function openPaymentBalancePage(page: Page): Promise<void> {
  await openDashboardFromBottomNav(page);
  const card = page.getByText('Equilibrar Pagos');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  await expect(
    page.getByRole('heading', { name: /equilibrio de pagos/i })
  ).toBeVisible({ timeout: 10_000 });
}

export async function createBalanceTransfer(
  page: Page,
  input: BalanceTransferInput
): Promise<void> {
  await openPaymentBalancePage(page);

  // 0. Open the form if collapsed
  const openFormBtn = page.getByRole('button', { name: 'Nueva Transferencia' });
  if (await openFormBtn.isVisible()) {
    await openFormBtn.click();
  }

  // 1. Operation type
  if (input.operationType === 'avance') {
    await page.getByRole('tab', { name: 'Avance' }).click();
  } else {
    await page.getByRole('tab', { name: 'Equilibrio' }).click();
  }

  // 2. From Method
  const fromTrigger = page.getByTestId('balance-from-method-select');
  await fromTrigger.click();
  await page
    .getByRole('option', { name: METHOD_LABELS[input.fromMethod] })
    .click();

  // 3. To Method
  const toTrigger = page.getByTestId('balance-to-method-select');
  await toTrigger.click();
  await page
    .getByRole('option', { name: METHOD_LABELS[input.toMethod] })
    .click();

  // 4. Amount Out
  const amountOutInput = page.locator('#amountOut');
  await amountOutInput.fill(input.amountOutBs.toString());

  // 5. Amount In (if avance)
  if (input.operationType === 'avance') {
    const amountInInput = page.locator('#amountIn');
    await amountInInput.fill(input.amountInBs.toString());
  }

  // 6. Notes
  if (input.notes) {
    await page.locator('#notes').fill(input.notes);
  }

  // 7. Submit
  const submitBtn = page.getByTestId('balance-transfer-submit');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await expect(
    page.getByText(/transferencia registrada|operación agregada|éxito/i)
  ).toBeVisible({ timeout: 10_000 });
}
