import {
  type ExpectedLedger,
  type MatrixScenario,
  type MethodTotals,
  type TipScenarioState,
  type SupportedPaymentMethod,
} from './types';

const METHODS: SupportedPaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

export function createEmptyMethodTotals(): MethodTotals {
  return {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };
}

function toStatusCount(
  scenarios: MatrixScenario[],
  status: TipScenarioState
): number {
  return scenarios.filter((scenario) => scenario.tipState === status).length;
}

export function createBaseLedger(
  seed: number,
  runMarker: string,
  scenarios: MatrixScenario[]
): ExpectedLedger {
  const methodTotals = createEmptyMethodTotals();
  let incomeDeltaBs = 0;

  for (const scenario of scenarios) {
    incomeDeltaBs += scenario.basePriceBs + scenario.tipAmountBs;

    methodTotals[scenario.paymentMethod] += scenario.basePriceBs;

    if (scenario.tipAmountBs > 0) {
      const tipMethod = scenario.tipPaymentMethod ?? scenario.paymentMethod;
      methodTotals[tipMethod] += scenario.tipAmountBs;

      if (scenario.tipState === 'paid') {
        methodTotals[tipMethod] -= scenario.tipAmountBs;
      }
    }
  }

  const paidTipTotal = scenarios
    .filter((scenario) => scenario.tipState === 'paid')
    .reduce((sum, scenario) => sum + scenario.tipAmountBs, 0);

  return {
    seed,
    runMarker,
    scenarios,
    saleArtifacts: [],
    incomeDeltaBs,
    expenseDeltaBs: paidTipTotal,
    netDeltaBs: incomeDeltaBs - paidTipTotal,
    transactionsDelta: scenarios.length + toStatusCount(scenarios, 'paid'),
    methodTotalsDelta: methodTotals,
    expectedTipsTotal: scenarios
      .filter((scenario) => scenario.tipState !== 'none')
      .reduce((sum, scenario) => sum + scenario.tipAmountBs, 0),
    expectedTipsPending: toStatusCount(scenarios, 'pending'),
    expectedTipsPaid: toStatusCount(scenarios, 'paid'),
  };
}

export function summarizeSplitByMethod(input: {
  splitRows: Array<{
    paymentMethod: SupportedPaymentMethod;
    amountBs: number;
  }>;
}): MethodTotals {
  const totals = createEmptyMethodTotals();

  for (const method of METHODS) {
    totals[method] = input.splitRows
      .filter((row) => row.paymentMethod === method)
      .reduce((sum, row) => sum + row.amountBs, 0);
  }

  return totals;
}
