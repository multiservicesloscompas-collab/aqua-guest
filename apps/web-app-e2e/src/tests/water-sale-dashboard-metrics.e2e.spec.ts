import { type Page } from '@playwright/test';
import { documented, expect, test } from '../support/fixtures';
import { TOAST_SALE_REGISTERED, expectToast } from '../support/toasts';
import { createRunMarker } from '../support/runMarker';
import { listSalesByMarker } from '../support/supabaseClient';
import { waitForSaleByMarker } from '../support/dbPolling';
import {
  gotoDashboard,
  openDashboardFromBottomNav,
  openTransactionsFromMenu,
  openWaterSalesFromBottomNav,
} from '../support/uiNavigation';
import { parseBsAmount } from '../support/money';
import {
  assertNoEditSaleModal,
  assertSaleStoredWithoutMixedOrTip,
  assertSimpleCheckoutGuards,
} from '../support/simpleSaleGuards';

type SupportedMethod = 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';

interface MethodCase {
  tag: `@${SupportedMethod}`;
  method: SupportedMethod;
  label: string;
  transactionLabel: RegExp;
}

const METHOD_CASES: MethodCase[] = [
  {
    tag: '@efectivo',
    method: 'efectivo',
    label: 'Efectivo',
    transactionLabel: /efectivo/i,
  },
  {
    tag: '@pago_movil',
    method: 'pago_movil',
    label: 'Pago Móvil',
    transactionLabel: /pago\s*m[oó]vil/i,
  },
  {
    tag: '@punto_venta',
    method: 'punto_venta',
    label: 'Punto de Venta',
    transactionLabel: /punto\s*de\s*venta/i,
  },
  {
    tag: '@divisa',
    method: 'divisa',
    label: 'Divisa',
    transactionLabel: /divisa/i,
  },
];

// Every sale in this spec uses a fixed price, so each figure is exact.
const SALE_PRICE_BS = 3000;
const FOUR_SALE_PRICES: Record<SupportedMethod, number> = {
  efectivo: 2000,
  pago_movil: 2500,
  punto_venta: 3000,
  divisa: 3500,
};

async function selectBottleProduct(page: Page, customPrice?: number) {
  await assertNoEditSaleModal(page, {
    context: 'before opening add-product sheet',
    closeIfOpen: true,
  });
  const addProductFab = page.getByTestId('water-sales-add-product-fab');
  await expect(addProductFab).toBeVisible();
  await addProductFab.click();

  await expect(
    page.getByRole('heading', { name: 'Agregar Producto' })
  ).toBeVisible();
  const addProductDialog = page.getByRole('dialog', {
    name: /agregar producto/i,
  });
  const bottleOptionByTestId = addProductDialog
    .getByTestId('add-product-option-botellon')
    .first();
  const bottleOptionByName = addProductDialog
    .getByRole('button', { name: /botell[oó]n nuevo/i })
    .first();
  await expect
    .poll(
      async () =>
        (await bottleOptionByTestId.count()) +
        (await bottleOptionByName.count()),
      {
        timeout: 10_000,
        message:
          'Bottle option was not found inside add-product dialog (create-only path).',
      }
    )
    .toBeGreaterThan(0);
  const bottleOption =
    (await bottleOptionByTestId.count()) > 0
      ? bottleOptionByTestId
      : bottleOptionByName;

  await expect(bottleOption).toBeVisible();
  await bottleOption.click();
  await assertNoEditSaleModal(page, {
    context: 'after selecting bottle option',
    closeIfOpen: true,
  });

  if (customPrice !== undefined) {
    const priceInputByTestId = page.getByTestId('add-product-unit-price-input');
    const priceInputByOrder = page.locator('input[type="number"]').first();
    await expect
      .poll(
        async () =>
          (await priceInputByTestId.count()) +
          (await priceInputByOrder.count()),
        {
          timeout: 10_000,
          message: 'Unit price input did not appear in add-product sheet',
        }
      )
      .toBeGreaterThan(0);
    const priceInput =
      (await priceInputByTestId.count()) > 0
        ? priceInputByTestId.first()
        : priceInputByOrder;

    await expect(priceInput).toBeVisible();
    await priceInput.fill(customPrice.toString());
  }
  const confirmAddButton = page.getByTestId('add-product-confirm');
  await expect(confirmAddButton).toBeVisible();
  await expect(confirmAddButton).toBeEnabled();
  await confirmAddButton.click();
  await assertNoEditSaleModal(page, {
    context: 'after confirming add-to-cart',
    closeIfOpen: true,
  });
}

async function completeSimpleSale(
  page: Page,
  method: SupportedMethod,
  notesValue: string
) {
  await assertNoEditSaleModal(page, {
    context: 'before opening cart',
    closeIfOpen: true,
  });
  await page.getByTestId('water-sales-open-cart-mobile').click();
  await expect(page.getByRole('heading', { name: /carrito/i })).toBeVisible();

  await assertSimpleCheckoutGuards(page, method);
  await page.getByTestId('cart-notes-input').fill(notesValue);
  await page.getByTestId('cart-confirm-sale').click();
  await assertNoEditSaleModal(page, {
    context: 'after confirming simple sale',
    closeIfOpen: true,
  });
}

test.describe('water sale propagation vertical slice', () => {
  for (const methodCase of METHOD_CASES) {
    test(
      `${methodCase.tag} propagates to dashboard, transactions, and method detail`,
      documented({
        titulo: `Venta en ${methodCase.label} llega al dashboard y a Transacciones`,
        area: 'Ventas de agua',
        intent: `Comprobar que una venta simple pagada en ${methodCase.label} llega a la tarjeta de ${methodCase.label}, a Transacciones y al detalle del método.`,
        steps: [
          `Lee la tarjeta de ${methodCase.label} del dashboard (debe estar en Bs 0).`,
          'Abre Agua, agrega un Botellón Nuevo a Bs 3000 y abre el carrito.',
          `Deja el pago mixto y la propina apagados, elige ${methodCase.label} y confirma la venta.`,
          'Vuelve al dashboard, abre Transacciones y luego el detalle del método.',
        ],
        expects: [
          `La tarjeta de ${methodCase.label} pasa de Bs 0 a Bs 3000 exactos.`,
          'Aparece el aviso «¡Venta registrada correctamente!».',
          `La venta queda en la base con método ${methodCase.label} y total Bs 3000, sin splits ni propina.`,
          'Transacciones muestra una fila «Venta de Agua» con ese método.',
          'El detalle del método muestra la venta.',
        ],
        data: 'Botellón Nuevo a Bs 3000, tasa 1000.',
      }),
      async ({ page }) => {
        const marker = createRunMarker();
        const baselineRows = await listSalesByMarker(marker.id);
        const baselineIds = new Set(baselineRows.map((sale) => sale.id));

        await gotoDashboard(page);
        await assertNoEditSaleModal(page, {
          context: 'after dashboard bootstrap',
          closeIfOpen: true,
        });

        const dashboardCard = page.getByTestId(
          `dashboard-method-card-${methodCase.method}`
        );
        await expect(dashboardCard).toBeVisible();
        const dashboardBefore = parseBsAmount(await dashboardCard.innerText());
        expect(dashboardBefore).toBe(0);

        await openWaterSalesFromBottomNav(page);

        await selectBottleProduct(page, SALE_PRICE_BS);
        await completeSimpleSale(page, methodCase.method, marker.notesValue);

        await expectToast(page, TOAST_SALE_REGISTERED);

        const sale = await waitForSaleByMarker(marker.id);
        expect(sale.paymentMethod).toBe(methodCase.method);
        expect(sale.totalBs).toBe(SALE_PRICE_BS);
        await assertSaleStoredWithoutMixedOrTip(sale.id, methodCase.method);

        await openDashboardFromBottomNav(page);

        const dashboardAfter = parseBsAmount(await dashboardCard.innerText());
        expect(dashboardAfter).toBe(dashboardBefore + sale.totalBs);

        await openTransactionsFromMenu(page);
        const transactionRow = page.getByTestId(`transaction-row-${sale.id}`);
        await expect(transactionRow).toBeVisible();
        await expect(transactionRow).toContainText('Venta de Agua');
        await expect(transactionRow).toContainText(methodCase.transactionLabel);

        await openDashboardFromBottomNav(page);
        await dashboardCard.click();

        const paymentMethodRow = page.getByTestId(
          `payment-method-transaction-row-sale-${sale.id}`
        );
        await expect(paymentMethodRow).toBeVisible();
        await expect(paymentMethodRow).toContainText('Venta de Agua');
        await expect(paymentMethodRow).toContainText('Venta #');

        const afterRows = await listSalesByMarker(marker.id);
        const createdRows = afterRows.filter((row) => !baselineIds.has(row.id));
        expect(createdRows).toHaveLength(1);
        expect(createdRows.some((row) => row.id === sale.id)).toBeTruthy();
      }
    );
  }

  test(
    'dashboard transactions and metrics validation with 4 simple water sales',
    documented({
      titulo: 'Cuatro ventas, una por método, suman exacto en el dashboard',
      area: 'Ventas de agua',
      intent:
        'Comprobar que 4 ventas simples, una por método, se reflejan exactas en el dashboard.',
      steps: [
        'Lee las 4 tarjetas por método y el contador de transacciones (todo en 0).',
        'Vende un Botellón por método: efectivo Bs 2000, pago móvil Bs 2500, punto de venta Bs 3000 y divisa Bs 3500, cada una sin pago mixto ni propina.',
        'Vuelve al dashboard.',
      ],
      expects: [
        'Cada venta queda en la base con su método y su total exacto, sin splits ni propina.',
        'El contador de transacciones marca 4.',
        'Las tarjetas muestran exactamente Bs 2000, 2500, 3000 y 3500.',
        'La suma de las tarjetas es Bs 11000.',
      ],
      data: 'Precios fijos 2000, 2500, 3000 y 3500; tasa 1000.',
    }),
    async ({ page }) => {
      await gotoDashboard(page);
      await assertNoEditSaleModal(page, {
        context: 'after dashboard bootstrap (4-sales scenario)',
        closeIfOpen: true,
      });
      const paymentMethods = [
        'efectivo',
        'pago_movil',
        'punto_venta',
        'divisa',
      ] as const;
      const baselineMethodTotals = new Map<string, number>();
      let baselineMethodsSum = 0;

      for (const method of paymentMethods) {
        const methodCard = page.getByTestId(`dashboard-method-card-${method}`);
        await expect(methodCard).toBeVisible();
        const baseline = parseBsAmount(await methodCard.innerText());
        baselineMethodTotals.set(method, baseline);
        baselineMethodsSum += baseline;
      }

      const baselineTransactions = Number(
        (
          await page.getByTestId('dashboard-kpi-transactions-value').innerText()
        ).trim()
      );
      expect(baselineMethodsSum).toBe(0);
      expect(baselineTransactions).toBe(0);

      const prices: number[] = [];
      const runMarkers: string[] = [];

      for (const method of paymentMethods) {
        const marker = createRunMarker();
        runMarkers.push(marker.id);
        const price = FOUR_SALE_PRICES[method];
        prices.push(price);

        await openWaterSalesFromBottomNav(page);
        await selectBottleProduct(page, price);
        await completeSimpleSale(page, method, marker.notesValue);

        await expectToast(page, TOAST_SALE_REGISTERED);

        const sale = await waitForSaleByMarker(marker.id);
        expect(sale.notes).toBe(marker.notesValue);
        expect(sale.totalBs).toBe(price);
        expect(runMarkers).toContain(marker.id);
        await assertSaleStoredWithoutMixedOrTip(sale.id, method);
      }

      await openDashboardFromBottomNav(page);

      await expect
        .poll(async () => {
          const value = await page
            .getByTestId('dashboard-kpi-transactions-value')
            .innerText();
          return Number(value.trim());
        })
        .toBe(baselineTransactions + 4);

      const methodCards: { method: string; index: number }[] = [
        { method: 'efectivo', index: 0 },
        { method: 'pago_movil', index: 1 },
        { method: 'punto_venta', index: 2 },
        { method: 'divisa', index: 3 },
      ];

      let totalDisplayed = 0;
      for (const { method, index } of methodCards) {
        const methodCard = page.getByTestId(`dashboard-method-card-${method}`);
        await expect(methodCard).toBeVisible();

        const cardText = await methodCard.innerText();
        const displayedPrice = parseBsAmount(cardText);
        const baselineForMethod = baselineMethodTotals.get(method) ?? 0;
        expect(displayedPrice).toBe(baselineForMethod + prices[index]);
        totalDisplayed += displayedPrice;
      }

      const totalExpected = prices.reduce((sum, price) => sum + price, 0);
      expect(totalExpected).toBe(11000);
      expect(totalDisplayed).toBe(baselineMethodsSum + totalExpected);
    }
  );
});
