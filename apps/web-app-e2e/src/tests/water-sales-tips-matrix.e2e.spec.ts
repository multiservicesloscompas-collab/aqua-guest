import { expect, test } from '@playwright/test';
import {
  listSaleSplitsBySaleIds,
  listSalesByMarker,
  listTipsBySaleOriginIds,
} from '../support/supabaseClient';
import {
  assertDashboardDeltas,
  assertExpensesModuleForPaidTips,
  assertSalesDescriptors,
  assertTipsModule,
  assertTransactionsRows,
} from '../support/waterSalesTipsMatrix/assertions';
import { waitTipsBySaleOrigins } from '../support/waterSalesTipsMatrix/dbWaits';
import { createBaseLedger } from '../support/waterSalesTipsMatrix/ledger';
import { createMatrixRunMarker } from '../support/waterSalesTipsMatrix/marker';
import { buildTipsMatrixScenarios } from '../support/waterSalesTipsMatrix/matrixPlanner';
import { createSeededRng } from '../support/waterSalesTipsMatrix/seededRng';
import type {
  MatrixScenario,
  SupportedPaymentMethod,
} from '../support/waterSalesTipsMatrix/types';
import {
  bootstrapAtDashboard,
  captureDashboardSnapshot,
  createScenarioSale,
  openTipsModule,
} from '../support/waterSalesTipsMatrix/uiHelpers';

function assertPlannerEdgeCases(scenarios: MatrixScenario[]) {
  expect(
    scenarios.some((scenario) => scenario.basePriceBs === 80)
  ).toBeTruthy();
  expect(
    scenarios.some((scenario) => scenario.basePriceBs === 2000)
  ).toBeTruthy();

  for (const scenario of scenarios) {
    expect(scenario.basePriceBs).toBeGreaterThanOrEqual(80);
    expect(scenario.basePriceBs).toBeLessThanOrEqual(2000);
  }

  const byMethod = scenarios.reduce<Record<SupportedPaymentMethod, number>>(
    (acc, scenario) => {
      acc[scenario.paymentMethod] += 1;
      return acc;
    },
    { efectivo: 0, pago_movil: 0, punto_venta: 0, divisa: 0 }
  );

  expect(byMethod.efectivo).toBeLessThanOrEqual(3);
  expect(byMethod.pago_movil).toBeLessThanOrEqual(3);
  expect(byMethod.punto_venta).toBeLessThanOrEqual(3);
  expect(byMethod.divisa).toBeLessThanOrEqual(3);

  expect(
    scenarios.some((scenario) => scenario.tipState === 'paid')
  ).toBeTruthy();
  expect(
    scenarios.some((scenario) => scenario.tipState === 'pending')
  ).toBeTruthy();
  expect(
    scenarios.some((scenario) => scenario.tipState === 'none')
  ).toBeTruthy();
}

test('water sales tips matrix validates propagation end-to-end', async ({
  page,
}) => {
  const marker = createMatrixRunMarker();
  const rng = createSeededRng(marker.seed);
  const scenarios = buildTipsMatrixScenarios({
    runMarker: marker.runMarker,
    nextRandom: rng,
    scenarioCount: 7,
  });

  assertPlannerEdgeCases(scenarios);

  const ledger = createBaseLedger(marker.seed, marker.runMarker, scenarios);

  test
    .info()
    .annotations.push({ type: 'seed', description: String(marker.seed) });
  test
    .info()
    .annotations.push({ type: 'run-marker', description: marker.runMarker });

  await bootstrapAtDashboard(page);
  const dashboardBefore = await captureDashboardSnapshot(page);

  for (const scenario of scenarios) {
    await createScenarioSale(page, scenario);
  }

  const createdSales = await expect
    .poll(async () => listSalesByMarker(marker.runMarker), {
      timeout: 20_000,
      intervals: [500, 1_000, 2_000],
    })
    .toHaveLength(scenarios.length)
    .then(async () => listSalesByMarker(marker.runMarker));

  const saleIdByScenario: Record<string, string> = {};
  for (const scenario of scenarios) {
    const matched = createdSales.find((sale) =>
      sale.notes?.includes(scenario.noteMarker)
    );
    expect(matched?.id).toBeTruthy();
    if (!matched) {
      throw new Error(`No sale found for scenario ${scenario.id}`);
    }
    saleIdByScenario[scenario.id] = matched.id;
  }

  const saleIds = Object.values(saleIdByScenario);
  const splitRows = await listSaleSplitsBySaleIds(saleIds);
  const expectedTips = scenarios.filter(
    (scenario) => scenario.tipState !== 'none'
  ).length;
  const tips = await waitTipsBySaleOrigins(saleIds, expectedTips);

  ledger.saleArtifacts = scenarios.map((scenario) => {
    const saleId = saleIdByScenario[scenario.id];
    const sale = createdSales.find((row) => row.id === saleId);
    if (!sale) {
      throw new Error(`Missing created sale row for scenario ${scenario.id}`);
    }
    const splitAmounts = splitRows
      .filter((split) => split.saleId === saleId)
      .map((split) => ({
        method: split.paymentMethod,
        amountBs: split.amountBs,
        amountUsd: split.amountUsd,
      }));

    const tip = tips.find((entry) => entry.originId === saleId);

    return {
      scenarioId: scenario.id,
      saleId,
      dailyNumber: sale.dailyNumber,
      totalBs: sale.totalBs,
      paymentMethod: sale.paymentMethod as SupportedPaymentMethod,
      splitAmounts,
      tipId: tip?.id,
      tipAmountBs: tip?.amountBs,
      tipPaymentMethod: tip?.capturePaymentMethod,
    };
  });

  const paidTipIds = ledger.saleArtifacts
    .filter((artifact) => {
      const scenario = scenarios.find(
        (entry) => entry.id === artifact.scenarioId
      );
      if (!scenario) {
        throw new Error(`Missing scenario for artifact ${artifact.scenarioId}`);
      }
      return scenario.tipState === 'paid' && artifact.tipId;
    })
    .map((artifact) => artifact.tipId as string);

  if (paidTipIds.length > 0) {
    await openTipsModule(page);
    for (const tipId of paidTipIds) {
      await page.getByTestId(`tip-pay-button-${tipId}`).click();
    }

    await expect
      .poll(async () => {
        const latest = await listTipsBySaleOriginIds(saleIds);
        return latest.filter((tip) => tip.status === 'paid').length;
      })
      .toBe(ledger.expectedTipsPaid);
  }

  const dashboardAfter = await captureDashboardSnapshot(page);
  assertDashboardDeltas({
    before: dashboardBefore,
    after: dashboardAfter,
    ledger,
  });

  await assertTipsModule(page, ledger);
  await assertExpensesModuleForPaidTips({
    page,
    paidTipsCount: paidTipIds.length,
  });
  await assertTransactionsRows({
    page,
    saleDailyNumbers: ledger.saleArtifacts.map(
      (artifact) => artifact.dailyNumber
    ),
    paidTipsCount: paidTipIds.length,
  });
  await assertSalesDescriptors({ page, scenarios, saleIdByScenario });

  const refreshedTips = await listTipsBySaleOriginIds(saleIds);
  expect(refreshedTips.filter((tip) => tip.status === 'pending').length).toBe(
    ledger.expectedTipsPending
  );
  expect(refreshedTips.filter((tip) => tip.status === 'paid').length).toBe(
    ledger.expectedTipsPaid
  );
});
