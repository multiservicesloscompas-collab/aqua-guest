import { documented, expect, test } from '../support/fixtures';
import { payPendingTip } from '../support/drivers/expenseDriver';
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
  expectedTransactionRowsForSale,
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

test(
  'water sales tips matrix validates propagation end-to-end',
  documented({
    titulo: 'Siete ventas con propinas variadas cuadran en todo el sistema',
    area: 'Propinas',
    intent:
      'Comprobar de punta a punta que las propinas de 7 ventas se reflejan en dashboard, propinas, egresos y transacciones.',
    steps: [
      'Guarda las cifras del dashboard antes de empezar.',
      'Registra 7 ventas (semilla fija, siempre las mismas) con propina pendiente, pagada o ninguna, y distintos métodos de pago y de captura.',
      'Abre Propinas y paga por el drawer las propinas «pagadas», cada una con su método de captura.',
      'Revisa dashboard, Propinas, Egresos, Transacciones y la lista de Agua.',
    ],
    expects: [
      'El dashboard sube exactamente: ingresos = Σ(base + propina); egresos = Σ propinas pagadas; transacciones = 7 + propinas pagadas; y cada tarjeta por método según su reparto.',
      'Propinas muestra cada propina con «Pendiente» o «Pagada» y su monto.',
      'Egresos tiene un pago de propina derivado por cada propina pagada.',
      'Transacciones tiene una fila por venta (una por método si es mixta) y una por cada pago de propina.',
      'Cada venta muestra su etiqueta de propina y los descriptores «Método principal» y «Captura propina».',
      'La base tiene las propinas pendientes y pagadas esperadas.',
    ],
  }),
  async ({ page }) => {
    test.setTimeout(180_000);

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
    for (const scenario of scenarios) {
      const tip =
        scenario.tipState === 'none'
          ? 'sin propina'
          : `propina ${scenario.tipState} Bs ${
              scenario.tipAmountBs
            } capturada en ${
              scenario.tipPaymentMethod ?? scenario.paymentMethod
            }`;
      test.info().annotations.push({
        type: 'data',
        description: `${scenario.id}: Bs ${scenario.basePriceBs} en ${scenario.paymentMethod}, ${tip}`,
      });
    }

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

    const tipsToPay = ledger.saleArtifacts.flatMap((artifact) => {
      const scenario = scenarios.find(
        (entry) => entry.id === artifact.scenarioId
      );
      if (!scenario) {
        throw new Error(`Missing scenario for artifact ${artifact.scenarioId}`);
      }
      if (scenario.tipState !== 'paid' || !artifact.tipId) {
        return [];
      }
      return [
        {
          tipId: artifact.tipId,
          method: scenario.tipPaymentMethod ?? scenario.paymentMethod,
        },
      ];
    });

    if (tipsToPay.length > 0) {
      for (const { tipId, method } of tipsToPay) {
        await payPendingTip(page, tipId, method);
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
      paidTipIds: tipsToPay.map((tip) => tip.tipId),
    });
    await assertTransactionsRows({
      page,
      sales: ledger.saleArtifacts.map((artifact) => ({
        dailyNumber: artifact.dailyNumber,
        expectedRows: expectedTransactionRowsForSale(
          artifact.splitAmounts.map((split) => ({
            method: split.method,
            amountBs: split.amountBs,
          }))
        ),
      })),
      paidTipIds: tipsToPay.map((tip) => tip.tipId),
    });
    await assertSalesDescriptors({ page, scenarios, saleIdByScenario });

    const refreshedTips = await listTipsBySaleOriginIds(saleIds);
    expect(refreshedTips.filter((tip) => tip.status === 'pending').length).toBe(
      ledger.expectedTipsPending
    );
    expect(refreshedTips.filter((tip) => tip.status === 'paid').length).toBe(
      ledger.expectedTipsPaid
    );
  }
);
