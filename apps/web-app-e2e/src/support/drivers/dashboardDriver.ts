import { expect, type Page } from '@playwright/test';
import { parseUniversalMoney } from '../money';
import { gotoDashboard, openDashboardFromBottomNav } from '../uiNavigation';
import type {
  CommercialLedgerState,
  MethodTotals,
  SupportedPaymentMethod,
} from '../masterLedger/ledgerTypes';

const METHODS: SupportedPaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

export interface DashboardMetricsSnapshot {
  mtdIncomeBs: number;
  mtdNetBs: number;
  dayExpensesBs: number;
  dayNetBs: number;
  transactionsCount: number;
  methodTotals: MethodTotals;
}

export async function captureDashboardSnapshot(
  page: Page
): Promise<DashboardMetricsSnapshot> {
  await openDashboardFromBottomNav(page);

  const mtdIncomeBs = parseUniversalMoney(
    await page.getByTestId('dashboard-kpi-mtd-income-value').innerText()
  );
  const mtdNetBs = parseUniversalMoney(
    await page.getByTestId('dashboard-kpi-mtd-net-value').innerText()
  );
  const dayExpensesBs = parseUniversalMoney(
    await page.getByTestId('dashboard-kpi-day-expenses-value').innerText()
  );
  const dayNetBs = parseUniversalMoney(
    await page.getByTestId('dashboard-kpi-day-net-value').innerText()
  );
  const transactionsRaw = await page
    .getByTestId('dashboard-kpi-transactions-value')
    .innerText();

  const match = transactionsRaw.match(/\d+/);
  const transactionsCount = match ? Number(match[0]) : 0;

  const methodTotals: MethodTotals = {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };

  for (const method of METHODS) {
    const cardText = await page
      .getByTestId(`dashboard-method-card-${method}`)
      .innerText();
    methodTotals[method] = parseUniversalMoney(cardText);
  }

  return {
    mtdIncomeBs,
    mtdNetBs,
    dayExpensesBs,
    dayNetBs,
    transactionsCount,
    methodTotals,
  };
}

export async function assertDashboardZero(page: Page): Promise<void> {
  await gotoDashboard(page);
  const snapshot = await captureDashboardSnapshot(page);

  expect(snapshot.mtdIncomeBs).toBe(0);
  expect(snapshot.mtdNetBs).toBe(0);
  expect(snapshot.dayExpensesBs).toBe(0);
  expect(snapshot.dayNetBs).toBe(0);
  expect(snapshot.transactionsCount).toBe(0);

  for (const method of METHODS) {
    expect(snapshot.methodTotals[method]).toBe(0);
  }
}

export async function assertDashboardMatchesLedger(
  page: Page,
  expected: CommercialLedgerState,
  options: { tolerance?: number } = {}
): Promise<void> {
  const tolerance = options.tolerance ?? 1;
  const snapshot = await captureDashboardSnapshot(page);

  // Top KPI values in Bs use toFixed(0) formatting in Dashboard
  expect(Math.round(snapshot.mtdIncomeBs)).toBe(Math.round(expected.incomeBs));
  expect(Math.round(snapshot.dayExpensesBs)).toBe(Math.round(expected.expenseBs));
  expect(Math.round(snapshot.mtdNetBs)).toBe(Math.round(expected.netBs));
  expect(snapshot.transactionsCount).toBe(expected.dashboardTransactionsCount);

  // Method totals use locale with 2 decimal places
  for (const method of METHODS) {
    expect(snapshot.methodTotals[method]).toBeCloseTo(
      expected.methodTotals[method],
      tolerance
    );
  }
}
