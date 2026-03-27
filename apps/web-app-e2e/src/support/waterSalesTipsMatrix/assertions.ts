import { expect, type Page } from '@playwright/test';
import type { ExpectedLedger, MatrixScenario, TipScenarioState } from './types';
import {
  type DashboardSnapshot,
  openTipsModule,
  openExpensesModule,
  openTransactionsModule,
  openWaterSalesFromBottomNav,
} from './uiHelpers';

export function assertDashboardDeltas(input: {
  before: DashboardSnapshot;
  after: DashboardSnapshot;
  ledger: ExpectedLedger;
}) {
  const { before, after, ledger } = input;

  expect(Math.round(after.mtdIncomeBs - before.mtdIncomeBs)).toBe(
    Math.round(ledger.incomeDeltaBs)
  );
  expect(Math.round(after.dayExpensesBs - before.dayExpensesBs)).toBe(
    Math.round(ledger.expenseDeltaBs)
  );
  expect(Math.round(after.mtdNetBs - before.mtdNetBs)).toBe(
    Math.round(ledger.netDeltaBs)
  );
  expect(after.transactionsCount - before.transactionsCount).toBe(
    ledger.transactionsDelta
  );

  expect(
    after.methodTotals.efectivo - before.methodTotals.efectivo
  ).toBeCloseTo(ledger.methodTotalsDelta.efectivo, 2);
  expect(
    after.methodTotals.pago_movil - before.methodTotals.pago_movil
  ).toBeCloseTo(ledger.methodTotalsDelta.pago_movil, 2);
  expect(
    after.methodTotals.punto_venta - before.methodTotals.punto_venta
  ).toBeCloseTo(ledger.methodTotalsDelta.punto_venta, 2);
  expect(after.methodTotals.divisa - before.methodTotals.divisa).toBeCloseTo(
    ledger.methodTotalsDelta.divisa,
    2
  );
}

export async function assertTipsModule(page: Page, ledger: ExpectedLedger) {
  await openTipsModule(page);

  const scenarioById = new Map(
    ledger.scenarios.map((scenario) => [scenario.id, scenario])
  );

  for (const artifact of ledger.saleArtifacts) {
    if (!artifact.tipId) {
      continue;
    }

    await expect(page.getByTestId(`tip-card-${artifact.tipId}`)).toBeVisible();
    await expect(
      page.getByTestId(`tip-capture-method-${artifact.tipId}`)
    ).toBeVisible();

    const statusBadge = page.getByTestId(`tip-status-badge-${artifact.tipId}`);
    if (artifact.tipAmountBs && artifact.tipAmountBs > 0) {
      await expect(statusBadge).toBeVisible();

      const scenario = scenarioById.get(artifact.scenarioId);
      if (scenario?.tipState === 'pending') {
        await expect(statusBadge).toContainText('Pendiente');
      }
      if (scenario?.tipState === 'paid') {
        await expect(statusBadge).toContainText('Pagada');
      }

      const localizedAmount = artifact.tipAmountBs.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      await expect(
        page.getByTestId(`tip-card-${artifact.tipId}`)
      ).toContainText(`Bs ${localizedAmount}`);
    }
  }
}

export async function assertExpensesModuleForPaidTips(input: {
  page: Page;
  paidTipsCount: number;
}) {
  await openExpensesModule(input.page);

  const payoutRows = input.page.getByTestId(/^expense-kind-pago-de-propina-/);
  await expect(payoutRows).toHaveCount(input.paidTipsCount);
}

export async function assertTransactionsRows(input: {
  page: Page;
  saleDailyNumbers: Array<number | null>;
  paidTipsCount: number;
}) {
  const { page, saleDailyNumbers, paidTipsCount } = input;
  await openTransactionsModule(page);

  for (const dailyNumber of saleDailyNumbers) {
    if (!dailyNumber) {
      continue;
    }

    await expect(
      page.locator('[data-testid^="transaction-row-"]', {
        hasText: `Venta de Agua #${dailyNumber}`,
      })
    ).toHaveCount(1);
  }

  const tipPayoutRows = page.locator('[data-testid^="transaction-row-"]', {
    hasText: 'Pago de Propina',
  });
  await expect(tipPayoutRows).toHaveCount(paidTipsCount);
}

function tipStateForScenario(scenario: MatrixScenario): TipScenarioState {
  return scenario.tipState;
}

export async function assertSalesDescriptors(input: {
  page: Page;
  scenarios: MatrixScenario[];
  saleIdByScenario: Record<string, string>;
}) {
  const { page, scenarios, saleIdByScenario } = input;
  await openWaterSalesFromBottomNav(page);

  for (const scenario of scenarios) {
    const saleId = saleIdByScenario[scenario.id];
    await expect(page.getByTestId(`sale-row-${saleId}`)).toBeVisible();

    const tipState = tipStateForScenario(scenario);
    if (tipState === 'none') {
      await expect(page.getByTestId(`sale-tip-badge-${saleId}`)).toHaveCount(0);
      continue;
    }

    await expect(page.getByTestId(`sale-tip-badge-${saleId}`)).toBeVisible();
    await expect(
      page.getByTestId(`sale-tip-descriptor-${saleId}`)
    ).toContainText(`Propina Bs ${scenario.tipAmountBs.toFixed(2)}`);
    const methodDescriptor = page.getByTestId(
      `sale-method-descriptor-${saleId}`
    );
    await expect(methodDescriptor).toContainText('Método principal:');
    await expect(methodDescriptor).toContainText('Captura propina:');
  }
}
