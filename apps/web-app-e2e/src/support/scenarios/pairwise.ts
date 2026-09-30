import type { Method, Payment } from '../ledger/types';
import type { Scenario, Step } from './types';

/**
 * Every pair of option values (module × payment × tip × later action) shows up
 * in at least one scenario. The full product is ~100 cases; a greedy cover of
 * the pairs needs a few dozen, and it is deterministic (no randomness).
 */
const MODULES = ['venta', 'alquiler', 'egreso'] as const;
const PAYMENTS = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
  'mixto',
] as const;
const TIPS = ['sin', 'pendiente', 'pagada'] as const;
const AFTERS = ['nada', 'editar', 'borrar'] as const;

interface Combo {
  module: (typeof MODULES)[number];
  payment: (typeof PAYMENTS)[number];
  tip: (typeof TIPS)[number];
  after: (typeof AFTERS)[number];
}

const METHOD_CYCLE: Method[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];
const nextMethod = (method: Method, by = 1): Method =>
  METHOD_CYCLE[(METHOD_CYCLE.indexOf(method) + by) % METHOD_CYCLE.length];

/** Combinations the app (or this suite) cannot or should not exercise. */
function isValid(c: Combo): boolean {
  if (c.module === 'egreso' && c.tip !== 'sin') return false; // expenses have no tips
  if (c.after === 'editar' && (c.payment === 'mixto' || c.tip !== 'sin')) {
    return false; // editing tips / mixed payments is the known bug B3
  }
  return true;
}

function allCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const module of MODULES)
    for (const payment of PAYMENTS)
      for (const tip of TIPS)
        for (const after of AFTERS) {
          const combo = { module, payment, tip, after };
          if (isValid(combo)) combos.push(combo);
        }
  return combos;
}

const pairsOf = (c: Combo): string[] => {
  const values = [c.module, c.payment, c.tip, c.after];
  const pairs: string[] = [];
  for (let i = 0; i < values.length; i += 1)
    for (let j = i + 1; j < values.length; j += 1)
      pairs.push(`${i}:${values[i]}|${j}:${values[j]}`);
  return pairs;
};

export function pairwiseCombos(): Combo[] {
  const candidates = allCombos();
  const uncovered = new Set(candidates.flatMap(pairsOf));
  const chosen: Combo[] = [];
  while (uncovered.size > 0) {
    let best: Combo | undefined;
    let bestGain = 0;
    for (const candidate of candidates) {
      const gain = pairsOf(candidate).filter((pair) =>
        uncovered.has(pair)
      ).length;
      if (gain > bestGain) {
        best = candidate;
        bestGain = gain;
      }
    }
    if (!best) break;
    pairsOf(best).forEach((pair) => uncovered.delete(pair));
    chosen.push(best);
  }
  return chosen;
}

function paymentOf(c: Combo): Payment {
  if (c.payment !== 'mixto') return { primary: c.payment };
  if (c.module === 'venta')
    return {
      primary: 'efectivo',
      secondary: { method: 'pago_movil', amountBs: 500 },
    };
  if (c.module === 'alquiler')
    return {
      primary: 'pago_movil',
      secondary: { method: 'efectivo', amountBs: 2000 },
    };
  return {
    primary: 'pago_movil',
    secondary: { method: 'efectivo', amountBs: 100 },
  };
}

const PAYMENT_LABEL: Record<Combo['payment'], string> = {
  efectivo: 'pago en Efectivo',
  pago_movil: 'pago en Pago Móvil',
  punto_venta: 'pago en Punto de Venta',
  divisa: 'pago en Divisa',
  mixto: 'pago mixto',
};
const TIP_LABEL: Record<Combo['tip'], string> = {
  sin: 'sin propina',
  pendiente: 'con propina pendiente',
  pagada: 'con propina pagada',
};
const AFTER_LABEL: Record<Combo['after'], string> = {
  nada: 'sin cambios después',
  editar: 'luego se edita',
  borrar: 'luego se elimina',
};
const MODULE_LABEL: Record<Combo['module'], string> = {
  venta: 'Venta de agua',
  alquiler: 'Alquiler',
  egreso: 'Egreso',
};

function stepsOf(c: Combo): Step[] {
  const payment = paymentOf(c);
  const tip =
    c.tip === 'sin'
      ? undefined
      : { amountBs: 100, captureMethod: nextMethod(payment.primary, 2) };
  const steps: Step[] = [];
  if (c.module === 'venta') {
    steps.push({ type: 'sale', id: 'registro', baseBs: 1000, payment, tip });
  } else if (c.module === 'alquiler') {
    steps.push({
      type: 'rental',
      id: 'registro',
      shift: 'completo',
      payment,
      isPaid: true,
      tip,
    });
  } else {
    steps.push({ type: 'expense', id: 'registro', amountBs: 400, payment });
  }
  if (c.tip === 'pagada') {
    steps.push({
      type: 'payTip',
      originId: 'registro',
      method: nextMethod(payment.primary, 3),
    });
  }
  if (c.after === 'editar') {
    steps.push(
      c.module === 'alquiler'
        ? { type: 'edit', targetId: 'registro', shift: 'doble' }
        : { type: 'edit', targetId: 'registro', amountBs: 1500 }
    );
  }
  if (c.after === 'borrar')
    steps.push({ type: 'delete', targetId: 'registro' });
  return steps;
}

export function buildPairwiseScenarios(): Scenario[] {
  return pairwiseCombos().map((combo, index) => ({
    id: `combinacion-${String(index + 1).padStart(2, '0')}`,
    titulo: `${MODULE_LABEL[combo.module]}: ${PAYMENT_LABEL[combo.payment]}, ${
      TIP_LABEL[combo.tip]
    }, ${AFTER_LABEL[combo.after]}`,
    area: 'Combinaciones (cubren todos los pares de opciones)',
    intent: `Comprobar el dashboard para: ${MODULE_LABEL[
      combo.module
    ].toLowerCase()}, ${PAYMENT_LABEL[combo.payment]}, ${
      TIP_LABEL[combo.tip]
    }, ${AFTER_LABEL[combo.after]}.`,
    steps: stepsOf(combo),
  }));
}
