import { expect, type Page } from '@playwright/test';
import {
  gotoDashboard,
  openDashboardFromBottomNav,
  openTransactionsFromMenu,
  openWaterSalesFromBottomNav,
} from '../uiNavigation';
import { parseBsAmount } from '../money';
import type { MatrixScenario, SupportedPaymentMethod } from './types';

const METHOD_CARD_ORDER: SupportedPaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

export interface DashboardSnapshot {
  mtdIncomeBs: number;
  mtdNetBs: number;
  dayExpensesBs: number;
  dayNetBs: number;
  transactionsCount: number;
  methodTotals: Record<SupportedPaymentMethod, number>;
}

export async function selectBottleProduct(page: Page, customPrice?: number) {
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

export async function createScenarioSale(page: Page, scenario: MatrixScenario) {
  await openWaterSalesFromBottomNav(page);
  await selectBottleProduct(page, scenario.basePriceBs);

  await page.getByTestId('water-sales-open-cart-mobile').click();
  await page
    .getByTestId(`cart-payment-method-${scenario.paymentMethod}`)
    .click();

  if (scenario.tipState !== 'none') {
    await page.getByTestId('cart-tip-toggle').click();
    await page
      .getByTestId('cart-tip-amount-input')
      .fill(scenario.tipAmountBs.toString());

    if (scenario.tipPaymentMethod) {
      await page
        .getByTestId(`cart-tip-payment-method-${scenario.tipPaymentMethod}`)
        .click();
    }
  }

  await page.getByTestId('cart-notes-input').fill(scenario.noteMarker);
  await page.getByTestId('cart-confirm-sale').click();
  await expect(
    page.getByText('¡Venta registrada correctamente!')
  ).toBeVisible();
}

function parseIntegerText(text: string): number {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function captureDashboardSnapshot(
  page: Page
): Promise<DashboardSnapshot> {
  await openDashboardFromBottomNav(page);

  const mtdIncomeBs = parseBsAmount(
    await page.getByTestId('dashboard-kpi-mtd-income-value').innerText()
  );
  const mtdNetBs = parseBsAmount(
    await page.getByTestId('dashboard-kpi-mtd-net-value').innerText()
  );
  const dayExpensesBs = parseBsAmount(
    await page.getByTestId('dashboard-kpi-day-expenses-value').innerText()
  );
  const dayNetBs = parseBsAmount(
    await page.getByTestId('dashboard-kpi-day-net-value').innerText()
  );

  const transactionsText = await page
    .getByTestId('dashboard-kpi-transactions-value')
    .innerText();

  const methodTotals = {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  } satisfies Record<SupportedPaymentMethod, number>;

  for (const method of METHOD_CARD_ORDER) {
    const cardText = await page
      .getByTestId(`dashboard-method-card-${method}`)
      .innerText();
    methodTotals[method] = parseBsAmount(cardText);
  }

  return {
    mtdIncomeBs,
    mtdNetBs,
    dayExpensesBs,
    dayNetBs,
    transactionsCount: parseIntegerText(transactionsText),
    methodTotals,
  };
}

export async function openTipsModule(page: Page) {
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Propinas').click();
  await expect(page.getByTestId('tips-summary-card')).toBeVisible();
}

export async function openExpensesModule(page: Page) {
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Egresos').click();
  await expect(page.getByRole('heading', { name: 'Egresos' })).toBeVisible();
}

export async function openTransactionsModule(page: Page) {
  await openTransactionsFromMenu(page);
}

export async function bootstrapAtDashboard(page: Page) {
  await gotoDashboard(page);
}

export { openWaterSalesFromBottomNav };
