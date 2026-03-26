import { generateBoundedPrices } from './priceGenerator';
import { createScenarioNote } from './marker';
import {
  type MatrixScenario,
  type SupportedPaymentMethod,
  type TipScenarioState,
} from './types';

const WEIGHTED_METHODS: SupportedPaymentMethod[] = [
  'pago_movil',
  'pago_movil',
  'divisa',
  'punto_venta',
  'punto_venta',
  'punto_venta',
  'efectivo',
];

const TIP_STATES: TipScenarioState[] = ['paid', 'pending', 'none'];
const TIP_AMOUNT_RANGE = { min: 20, max: 220 };
const TIP_METHODS: SupportedPaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

function pickWeightedMethod(
  nextRandom: () => number,
  methodUsage: Record<SupportedPaymentMethod, number>
): SupportedPaymentMethod {
  for (let attempts = 0; attempts < 100; attempts += 1) {
    const index = Math.floor(nextRandom() * WEIGHTED_METHODS.length);
    const candidate = WEIGHTED_METHODS[index];
    if (methodUsage[candidate] < 3) {
      methodUsage[candidate] += 1;
      return candidate;
    }
  }

  const fallback = (Object.keys(methodUsage) as SupportedPaymentMethod[]).find(
    (method) => methodUsage[method] < 3
  );

  if (!fallback) {
    throw new Error('Unable to allocate payment method under max-3 cap');
  }

  methodUsage[fallback] += 1;
  return fallback;
}

function nextTipAmount(nextRandom: () => number): number {
  const span = TIP_AMOUNT_RANGE.max - TIP_AMOUNT_RANGE.min + 1;
  return TIP_AMOUNT_RANGE.min + Math.floor(nextRandom() * span);
}

function pickTipMethod(nextRandom: () => number): SupportedPaymentMethod {
  const index = Math.floor(nextRandom() * TIP_METHODS.length);
  return TIP_METHODS[index];
}

export function buildTipsMatrixScenarios(input: {
  runMarker: string;
  nextRandom: () => number;
  scenarioCount?: number;
}): MatrixScenario[] {
  const scenarioCount = Math.max(input.scenarioCount ?? 7, TIP_STATES.length);
  const methodUsage: Record<SupportedPaymentMethod, number> = {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };

  const prices = generateBoundedPrices(scenarioCount, input.nextRandom);

  return Array.from({ length: scenarioCount }, (_, index) => {
    const tipState = TIP_STATES[index % TIP_STATES.length];
    const paymentMethod = pickWeightedMethod(input.nextRandom, methodUsage);
    const tipAmountBs =
      tipState === 'none' ? 0 : nextTipAmount(input.nextRandom);
    const tipPaymentMethod =
      tipState === 'none' ? undefined : pickTipMethod(input.nextRandom);
    const scenarioId = `scenario-${String(index + 1).padStart(2, '0')}`;

    return {
      id: scenarioId,
      noteMarker: createScenarioNote(input.runMarker, scenarioId),
      paymentMethod,
      basePriceBs: prices[index],
      tipState,
      tipAmountBs,
      tipPaymentMethod,
    };
  });
}
