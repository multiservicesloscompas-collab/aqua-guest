import {
  METHODS,
  type Expected,
  type Ledger,
  type LedgerRecord,
  type MethodTotals,
  type Payment,
  type RentalRecord,
  type RentalShift,
  type Tip,
} from './types';

/**
 * Expected dashboard figures, derived from the business rules in
 * docs/agents/commercial-rules.md — NOT from the app's own formulas, so a
 * mistake in the app cannot hide behind a copy of itself.
 */

const SHIFT_PRICE_USD: Record<RentalShift, number> = {
  medio: 4,
  completo: 6,
  doble: 12,
};
const COMPLETO_DIVISA_PRICE_USD = 5;

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const emptyLedger = (exchangeRate: number): Ledger => ({
  exchangeRate,
  records: [],
});

export const addRecord = (ledger: Ledger, record: LedgerRecord): Ledger => ({
  ...ledger,
  records: [...ledger.records, record],
});

export const removeRecord = (ledger: Ledger, id: string): Ledger => ({
  ...ledger,
  records: ledger.records.filter((record) => record.id !== id),
});

export const updateRecord = (
  ledger: Ledger,
  id: string,
  changes: Partial<LedgerRecord>
): Ledger => ({
  ...ledger,
  records: ledger.records.map((record) =>
    record.id === id ? ({ ...record, ...changes } as LedgerRecord) : record
  ),
});

export function setTipPayout(
  ledger: Ledger,
  originId: string,
  payoutMethod: Tip['payoutMethod']
): Ledger {
  return {
    ...ledger,
    records: ledger.records.map((record) =>
      (record.kind === 'sale' || record.kind === 'rental') &&
      record.id === originId &&
      record.tip
        ? { ...record, tip: { ...record.tip, payoutMethod } }
        : record
    ),
  };
}

export function rentalPrincipalUsd(rental: RentalRecord): number {
  const base =
    rental.shift === 'completo' && rental.payment.primary === 'divisa'
      ? COMPLETO_DIVISA_PRICE_USD
      : SHIFT_PRICE_USD[rental.shift];
  return base + rental.deliveryFeeUsd;
}

const emptyCards = (): MethodTotals => ({
  efectivo: 0,
  pago_movil: 0,
  punto_venta: 0,
  divisa: 0,
});

/** Splits a total across the payment methods, adding the tip to its capture method. */
function allocate(
  totalBs: number,
  payment: Payment,
  tip: Tip | undefined,
  cards: MethodTotals,
  sign: 1 | -1 = 1
): void {
  const secondaryBs = payment.secondary?.amountBs ?? 0;
  cards[payment.primary] += sign * (totalBs - secondaryBs);
  if (payment.secondary) cards[payment.secondary.method] += sign * secondaryBs;
  if (tip) cards[tip.captureMethod] += sign * tip.amountBs;
}

export function computeExpected(ledger: Ledger): Expected {
  const { exchangeRate } = ledger;
  const cards = emptyCards();
  let incomeBs = 0;
  let expenseBs = 0;
  let transactions = 0;
  let pendingTips = 0;
  let paidTips = 0;

  const countTip = (tip: Tip | undefined) => {
    if (!tip) return;
    if (tip.payoutMethod) {
      paidTips += 1;
      expenseBs += tip.amountBs;
      transactions += 1;
      cards[tip.payoutMethod] -= tip.amountBs;
    } else {
      pendingTips += 1;
    }
  };

  for (const record of ledger.records) {
    if (record.kind === 'sale') {
      const totalBs = record.baseBs + (record.tip?.amountBs ?? 0);
      incomeBs += totalBs;
      transactions += 1;
      allocate(record.baseBs, record.payment, record.tip, cards);
      countTip(record.tip);
    } else if (record.kind === 'rental') {
      // A tip on an unpaid rental is still pending; nothing else counts until paid.
      if (!record.isPaid) {
        countTip(record.tip);
        continue;
      }
      const baseBs = rentalPrincipalUsd(record) * exchangeRate;
      incomeBs += baseBs + (record.tip?.amountBs ?? 0);
      transactions += 1;
      allocate(baseBs, record.payment, record.tip, cards);
      countTip(record.tip);
    } else if (record.kind === 'expense') {
      expenseBs += record.amountBs;
      allocate(record.amountBs, record.payment, undefined, cards, -1);
    } else if (record.kind === 'prepaid') {
      incomeBs += record.amountBs;
      cards[record.method] += record.amountBs;
    } else {
      transactions += 1;
      cards[record.from] -= record.outBs;
      cards[record.to] += record.inBs;
    }
  }

  const rounded = emptyCards();
  for (const method of METHODS) rounded[method] = round2(cards[method]);
  return {
    incomeBs: round2(incomeBs),
    expenseBs: round2(expenseBs),
    netBs: round2(incomeBs - expenseBs),
    transactions,
    cards: rounded,
    pendingTips,
    paidTips,
  };
}

/** Sum of all cards must equal net plus what transfers add or lose (avance differences). */
export function transferDifferenceBs(ledger: Ledger): number {
  return round2(
    ledger.records.reduce(
      (sum, record) =>
        record.kind === 'transfer' ? sum + (record.inBs - record.outBs) : sum,
      0
    )
  );
}
