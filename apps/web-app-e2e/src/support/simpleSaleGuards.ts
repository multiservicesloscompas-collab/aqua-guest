import { expect, type Page } from '@playwright/test';
import {
  listSaleSplitsBySaleIds,
  listTipsBySaleOriginIds,
} from './supabaseClient';

type SupportedMethod = 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';

interface EditModalGuardOptions {
  context: string;
  closeIfOpen?: boolean;
}

export async function assertNoEditSaleModal(
  page: Page,
  { context, closeIfOpen = false }: EditModalGuardOptions
) {
  const editHeading = page.getByRole('heading', { name: /editar venta/i });
  const editCount = await editHeading.count();

  if (editCount === 0) {
    return;
  }

  if (closeIfOpen) {
    const closeButton = page.getByRole('button', { name: /cerrar/i }).first();
    if ((await closeButton.count()) > 0) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(editHeading).toHaveCount(0);
  }

  throw new Error(
    `[simple-sale-guard] Editar Venta modal detected during ${context}. ` +
      'This test must use create-only checkout and never open edit-sale context.'
  );
}

export async function assertSimpleCheckoutGuards(
  page: Page,
  method: SupportedMethod
) {
  await assertNoEditSaleModal(page, {
    context: 'simple checkout guard validation',
    closeIfOpen: true,
  });

  const mixedPaymentToggle = page.getByTestId('mixed-payment-toggle');
  if ((await mixedPaymentToggle.count()) > 0) {
    const mixedToggle = mixedPaymentToggle.first();
    await expect(mixedToggle).toBeVisible();

    const currentMixedState = await mixedToggle.getAttribute('aria-pressed');
    if (currentMixedState === 'true') {
      await mixedToggle.click();
    }

    await expect(mixedToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(mixedToggle).toHaveAttribute('data-state', 'off');
  }

  await expect(page.getByLabel('Monto método secundario (Bs)')).toHaveCount(0);

  await expect(page.getByTestId('cart-tip-amount-input')).toHaveCount(0);
  await expect(page.getByTestId('cart-tip-notes-input')).toHaveCount(0);
  await expect(page.getByTestId(/^cart-tip-payment-method-/)).toHaveCount(0);

  const methodButton = page.getByTestId(`cart-payment-method-${method}`);
  await expect(methodButton).toBeVisible();
  await methodButton.click();
  await expect(methodButton).toHaveAttribute('aria-pressed', 'true');

  await expect(page.getByLabel('Monto método secundario (Bs)')).toHaveCount(0);
}

export async function assertSaleStoredWithoutMixedOrTip(
  saleId: string,
  expectedMethod: SupportedMethod
) {
  const [splits, tips] = await Promise.all([
    listSaleSplitsBySaleIds([saleId]),
    listTipsBySaleOriginIds([saleId]),
  ]);

  const saleSplits = splits.filter((split) => split.saleId === saleId);
  expect(saleSplits.length).toBeLessThanOrEqual(1);

  if (saleSplits.length === 1) {
    expect(saleSplits[0].paymentMethod).toBe(expectedMethod);
  }

  expect(tips).toHaveLength(0);
}
