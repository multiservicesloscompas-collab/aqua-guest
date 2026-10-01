import { expect, type Page } from '@playwright/test';
import { parseUniversalMoney } from '../money';
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

/** Deletes the only transfer of the day from the Equilibrio screen (browser confirm dialog). */
export async function deleteBalanceTransfer(page: Page): Promise<void> {
  await openPaymentBalancePage(page);
  const trash = page.locator('button:has(svg.lucide-trash-2)');
  await expect(trash).toHaveCount(1);

  page.once('dialog', (dialog) => dialog.accept());
  await trash.first().click();

  await expect(trash).toHaveCount(0, { timeout: 10_000 });
}

/** Reads the Original or final amount of a method in the Equilibrio summary. */
export async function balanceAmount(
  page: Page,
  label: string,
  field: 'Original' | 'final'
): Promise<number> {
  const row = page
    .locator('div.rounded-xl.border', {
      has: page.getByText(label, { exact: true }),
    })
    .first();
  await expect(row).toBeVisible();
  if (field === 'Original') {
    return parseUniversalMoney(
      await row.locator('p', { hasText: 'Original:' }).first().innerText()
    );
  }
  return parseUniversalMoney(
    await row.locator('p.font-bold').first().innerText()
  );
}
