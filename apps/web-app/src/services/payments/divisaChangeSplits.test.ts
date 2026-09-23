import { describe, expect, it } from 'vitest';
import { buildDivisaTenderSplits } from './divisaChangeSplits';

describe('buildDivisaTenderSplits — canonical case (Bs 600, rate 850, paid with $5)', () => {
  const splits = buildDivisaTenderSplits({
    totalBs: 600,
    exchangeRate: 850,
    tenderedBills: { 5: 1 },
    changeBills: { 1: 4 },
    remainderMethod: 'efectivo',
  });

  it('emits exactly the three canonical rows with the right kind and exchangeRateUsed', () => {
    expect(splits).toEqual([
      {
        method: 'divisa',
        amountBs: 4250,
        amountUsd: 5,
        exchangeRateUsed: 850,
        kind: 'payment',
      },
      {
        method: 'divisa',
        amountBs: -3400,
        amountUsd: -4,
        exchangeRateUsed: 850,
        kind: 'change',
      },
      {
        method: 'efectivo',
        amountBs: -250,
        amountUsd: -0.29,
        exchangeRateUsed: 850,
        kind: 'change',
      },
    ]);
  });

  it('sums to the total exactly, not within a tolerance', () => {
    const sum = splits.reduce((s, x) => s + x.amountBs, 0);
    expect(sum).toBe(600);
  });
});

describe('buildDivisaTenderSplits — exact tender', () => {
  it('emits a single payment split, identical in shape to a plain divisa payment', () => {
    const splits = buildDivisaTenderSplits({
      totalBs: 850,
      exchangeRate: 850,
      tenderedBills: { 1: 1 },
      changeBills: {},
      remainderMethod: 'efectivo',
    });

    expect(splits).toEqual([
      {
        method: 'divisa',
        amountBs: 850,
        amountUsd: 1,
        exchangeRateUsed: 850,
        kind: 'payment',
      },
    ]);
  });
});

describe('buildDivisaTenderSplits — change entirely covered by bills (no Bs remainder)', () => {
  it('omits the remainder row when changeBills exactly cover the change due', () => {
    // Bs 850 sale, paid with $2, $1 back — change is exactly one $1 bill.
    const splits = buildDivisaTenderSplits({
      totalBs: 850,
      exchangeRate: 850,
      tenderedBills: { 1: 2 },
      changeBills: { 1: 1 },
      remainderMethod: 'efectivo',
    });

    expect(splits).toHaveLength(2);
    expect(splits.some((s) => s.method === 'efectivo')).toBe(false);
    expect(
      splits.find((s) => s.kind === 'change')?.amountBs
    ).toBe(-850);
  });
});

describe('buildDivisaTenderSplits — change entirely in Bs (no bills returned)', () => {
  it('omits the negative divisa row when no change bills are given back', () => {
    const splits = buildDivisaTenderSplits({
      totalBs: 100,
      exchangeRate: 850,
      tenderedBills: { 1: 1 },
      changeBills: {},
      remainderMethod: 'efectivo',
    });

    expect(splits).toHaveLength(2);
    expect(
      splits.some((s) => s.method === 'divisa' && s.kind === 'change')
    ).toBe(false);
    expect(splits.find((s) => s.method === 'efectivo')).toMatchObject({
      amountBs: -750,
      kind: 'change',
    });
  });
});

describe('buildDivisaTenderSplits — short tender (this IS a mixed payment)', () => {
  it('emits two positive payment rows, no change kind at all', () => {
    const splits = buildDivisaTenderSplits({
      totalBs: 5000,
      exchangeRate: 850,
      tenderedBills: { 5: 1 },
      changeBills: {},
      remainderMethod: 'efectivo',
      complementMethod: 'efectivo',
    });

    expect(splits).toEqual([
      {
        method: 'divisa',
        amountBs: 4250,
        amountUsd: 5,
        exchangeRateUsed: 850,
        kind: 'payment',
      },
      {
        method: 'efectivo',
        amountBs: 750,
        amountUsd: expect.closeTo(0.88, 2),
        exchangeRateUsed: 850,
        kind: 'payment',
      },
    ]);
    expect(splits.every((s) => s.amountBs > 0)).toBe(true);
    expect(splits.some((s) => s.kind === 'change')).toBe(false);
  });

  it('throws when the tender is short and no complementMethod is given', () => {
    expect(() =>
      buildDivisaTenderSplits({
        totalBs: 5000,
        exchangeRate: 850,
        tenderedBills: { 5: 1 },
        changeBills: {},
        remainderMethod: 'efectivo',
      })
    ).toThrow();
  });
});

describe('buildDivisaTenderSplits — invalid inputs', () => {
  it('rejects divisa as the remainder method', () => {
    expect(() =>
      buildDivisaTenderSplits({
        totalBs: 600,
        exchangeRate: 850,
        tenderedBills: { 5: 1 },
        changeBills: { 1: 4 },
        remainderMethod: 'divisa',
      })
    ).toThrow();
  });
});
