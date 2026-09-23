import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import {
  preferNonDivisaChangeLeg,
  reconcileSplitAmountsBs,
  reconcileSplitAmountsUsd,
} from './paymentSplitRounding';

describe('reconcileSplitAmountsUsd — default behavior (no selector)', () => {
  it('keeps picking the max-value split for an ordinary mixed payment', () => {
    const result = reconcileSplitAmountsUsd(2.71, [
      { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
      { method: 'pago_movil', amountBs: 40, amountUsd: 0.8 },
    ]);

    // sum of inputs is 2.0, target is 2.71: residual of 0.71 lands on the
    // largest split (efectivo).
    expect(result.find((s) => s.method === 'efectivo')?.amountUsd).toBe(1.91);
    expect(result.find((s) => s.method === 'pago_movil')?.amountUsd).toBe(0.8);
  });
});

describe('reconcileSplitAmountsUsd — preferNonDivisaChangeLeg', () => {
  const canonical: PaymentSplit[] = [
    { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
    { method: 'divisa', amountBs: -3400, amountUsd: -4, kind: 'change' },
    { method: 'efectivo', amountBs: -250, amountUsd: -0.29, kind: 'change' },
  ];

  it('lands a USD residual on the non-divisa change leg, leaving the tendered and divisa-change legs exact', () => {
    // Force a residual: ask the reconciler to hit 0.72 instead of the
    // splits' own sum of 0.71.
    const result = reconcileSplitAmountsUsd(
      0.72,
      canonical,
      preferNonDivisaChangeLeg
    );

    const tendered = result.find(
      (s) => s.method === 'divisa' && s.amountBs > 0
    );
    const divisaChange = result.find(
      (s) => s.method === 'divisa' && s.amountBs < 0
    );
    const remainder = result.find((s) => s.method === 'efectivo');

    expect(tendered?.amountUsd).toBe(5);
    expect(divisaChange?.amountUsd).toBe(-4);
    expect(remainder?.amountUsd).toBe(-0.28);
  });

  it('falls back to max-by-value when there is no non-divisa change leg', () => {
    const noRemainderLeg: PaymentSplit[] = [
      { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
      { method: 'divisa', amountBs: -4250, amountUsd: -5, kind: 'change' },
    ];

    const result = reconcileSplitAmountsUsd(
      0.01,
      noRemainderLeg,
      preferNonDivisaChangeLeg
    );

    // No non-divisa change leg exists, so the selector reports "no
    // preference" and the reconciler falls back to its default: the
    // largest-value split, which is the tendered leg.
    const tendered = result.find((s) => s.amountBs > 0);
    expect(tendered?.amountUsd).toBe(5.01);
  });
});

describe('reconcileSplitAmountsBs — the remainder leg absorbs the residual, not the tendered leg', () => {
  it('leaves the tendered leg exact when a Bs residual is forced', () => {
    const canonical: PaymentSplit[] = [
      { method: 'divisa', amountBs: 4250, kind: 'payment' },
      { method: 'divisa', amountBs: -3400, kind: 'change' },
      { method: 'efectivo', amountBs: -250, kind: 'change' },
    ];

    const result = reconcileSplitAmountsBs(
      601, // one Bs off from the splits' own sum of 600
      canonical,
      preferNonDivisaChangeLeg
    );

    const tendered = result.find((s) => s.amountBs > 0);
    const remainder = result.find((s) => s.method === 'efectivo');

    expect(tendered?.amountBs).toBe(4250);
    expect(remainder?.amountBs).toBe(-249);
  });
});
