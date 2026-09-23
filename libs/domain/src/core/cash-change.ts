// Cash-change arithmetic for USD-bill payments (divisa).
//
// In Venezuela, USD circulates only as bills ($1/$5/$10/$20/$100) — there are
// no coins or cents. A divisa payment therefore almost never matches the
// total exactly: the business keeps the bill handed over and returns change,
// typically as smaller USD bills plus a Bs remainder.
//
// This module is pure denominational arithmetic. It knows nothing about
// PaymentSplit or persistence — that composition lives in the app service
// layer (see apps/web-app/src/services/payments/divisaChangeSplits.ts).

export const USD_BILL_DENOMINATIONS = [100, 20, 10, 5, 1] as const;

export type UsdBillDenomination = (typeof USD_BILL_DENOMINATIONS)[number];

export type UsdBillCounts = Readonly<Partial<Record<UsdBillDenomination, number>>>;

const CURRENCY_DECIMALS = 2;

function roundToCurrency(value: number): number {
  const factor = 10 ** CURRENCY_DECIMALS;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function assertPositiveExchangeRate(exchangeRate: number): void {
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error(
      `La tasa de cambio debe ser mayor que cero (recibido: ${exchangeRate}).`
    );
  }
}

export function sumUsdBills(bills: UsdBillCounts): number {
  return USD_BILL_DENOMINATIONS.reduce(
    (sum, denomination) => sum + denomination * (bills[denomination] ?? 0),
    0
  );
}

export type CashTenderStatus = 'exact' | 'change_due' | 'short';

export interface CashTenderResult {
  tenderedUsd: number;
  tenderedBs: number;
  differenceBs: number;
  status: CashTenderStatus;
}

const TENDER_TOLERANCE_BS = 0.01;

export function evaluateCashTender(input: {
  totalBs: number;
  exchangeRate: number;
  tenderedBills: UsdBillCounts;
}): CashTenderResult {
  assertPositiveExchangeRate(input.exchangeRate);

  const tenderedUsd = sumUsdBills(input.tenderedBills);
  const tenderedBs = roundToCurrency(tenderedUsd * input.exchangeRate);
  const differenceBs = roundToCurrency(tenderedBs - input.totalBs);

  const status: CashTenderStatus =
    Math.abs(differenceBs) <= TENDER_TOLERANCE_BS
      ? 'exact'
      : differenceBs > 0
      ? 'change_due'
      : 'short';

  return { tenderedUsd, tenderedBs, differenceBs, status };
}

export interface ChangeBreakdown {
  usdBills: UsdBillCounts;
  changeUsd: number;
  changeUsdBs: number;
  remainderBs: number;
}

export function evaluateChangeBreakdown(input: {
  changeDueBs: number;
  exchangeRate: number;
  usdBills: UsdBillCounts;
}): ChangeBreakdown {
  assertPositiveExchangeRate(input.exchangeRate);

  const changeUsd = sumUsdBills(input.usdBills);
  const changeUsdBs = roundToCurrency(changeUsd * input.exchangeRate);
  const remainderBs = roundToCurrency(input.changeDueBs - changeUsdBs);

  return { usdBills: input.usdBills, changeUsd, changeUsdBs, remainderBs };
}

/**
 * Suggests a bill breakdown for the change due, greedy largest-denomination
 * first. This is advisory only — the app cannot know what bills are
 * physically in the drawer, so the cashier's own selection is authoritative.
 * `availableBills` is accepted but unused in v1; it is a documented seam for
 * a future drawer-inventory feature.
 */
export function suggestChangeBreakdown(input: {
  changeDueBs: number;
  exchangeRate: number;
  availableBills?: UsdBillCounts;
  maxDenomination?: UsdBillDenomination;
}): ChangeBreakdown {
  assertPositiveExchangeRate(input.exchangeRate);

  const cappedDenominations = USD_BILL_DENOMINATIONS.filter(
    (denomination) =>
      input.maxDenomination === undefined ||
      denomination <= input.maxDenomination
  );

  let remainingUsd = Math.floor(input.changeDueBs / input.exchangeRate);
  const usdBills: Partial<Record<UsdBillDenomination, number>> = {};

  for (const denomination of cappedDenominations) {
    if (remainingUsd < denomination) continue;
    const count = Math.floor(remainingUsd / denomination);
    if (count > 0) {
      usdBills[denomination] = count;
      remainingUsd -= denomination * count;
    }
  }

  return evaluateChangeBreakdown({
    changeDueBs: input.changeDueBs,
    exchangeRate: input.exchangeRate,
    usdBills,
  });
}

export function validateChangeBreakdown(input: {
  changeDueBs: number;
  exchangeRate: number;
  breakdown: ChangeBreakdown;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0) {
    errors.push('La tasa de cambio debe ser mayor que cero.');
  }

  for (const denomination of USD_BILL_DENOMINATIONS) {
    const count = input.breakdown.usdBills[denomination];
    if (count === undefined) continue;
    if (!Number.isInteger(count) || count < 0) {
      errors.push(
        `La cantidad de billetes de $${denomination} debe ser un entero no negativo.`
      );
    }
  }

  if (
    roundToCurrency(input.breakdown.changeUsdBs) >
    roundToCurrency(input.changeDueBs) + TENDER_TOLERANCE_BS
  ) {
    errors.push('El vuelto en billetes supera el vuelto total a entregar.');
  }

  if (input.breakdown.remainderBs < -TENDER_TOLERANCE_BS) {
    errors.push('El resto en bolívares no puede ser negativo.');
  }

  return { ok: errors.length === 0, errors };
}
