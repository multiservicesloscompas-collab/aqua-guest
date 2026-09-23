import { describe, expect, it } from 'vitest';
import {
  evaluateCashTender,
  evaluateChangeBreakdown,
  suggestChangeBreakdown,
  sumUsdBills,
  validateChangeBreakdown,
} from '../cash-change';

describe('sumUsdBills', () => {
  it('returns 0 for an empty bill count', () => {
    expect(sumUsdBills({})).toBe(0);
  });

  it('sums a single denomination', () => {
    expect(sumUsdBills({ 5: 3 })).toBe(15);
  });

  it('sums mixed denominations', () => {
    expect(sumUsdBills({ 1: 2, 5: 1, 20: 1 })).toBe(27);
  });

  it('ignores zero counts', () => {
    expect(sumUsdBills({ 1: 0, 5: 0 })).toBe(0);
  });
});

describe('evaluateCashTender', () => {
  it('reports change_due for the canonical Bs 600 / rate 850 / $5 case', () => {
    const result = evaluateCashTender({
      totalBs: 600,
      exchangeRate: 850,
      tenderedBills: { 5: 1 },
    });

    expect(result.tenderedUsd).toBe(5);
    expect(result.tenderedBs).toBe(4250);
    expect(result.differenceBs).toBe(3650);
    expect(result.status).toBe('change_due');
  });

  it('reports exact when the tendered bill matches the total exactly', () => {
    const result = evaluateCashTender({
      totalBs: 850,
      exchangeRate: 850,
      tenderedBills: { 1: 1 },
    });

    expect(result.differenceBs).toBe(0);
    expect(result.status).toBe('exact');
  });

  it('reports short when the tendered bills do not cover the total', () => {
    const result = evaluateCashTender({
      totalBs: 5000,
      exchangeRate: 850,
      tenderedBills: { 5: 1 },
    });

    expect(result.differenceBs).toBe(-750);
    expect(result.status).toBe('short');
  });

  it('throws when the exchange rate is not positive', () => {
    expect(() =>
      evaluateCashTender({
        totalBs: 600,
        exchangeRate: 0,
        tenderedBills: { 5: 1 },
      })
    ).toThrow();
  });
});

describe('evaluateChangeBreakdown', () => {
  it('computes the Bs equivalent of the returned bills and the remainder', () => {
    const result = evaluateChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
      usdBills: { 1: 4 },
    });

    expect(result.changeUsd).toBe(4);
    expect(result.changeUsdBs).toBe(3400);
    expect(result.remainderBs).toBe(250);
  });

  it('treats an empty bill selection as an all-Bs remainder', () => {
    const result = evaluateChangeBreakdown({
      changeDueBs: 250,
      exchangeRate: 850,
      usdBills: {},
    });

    expect(result.changeUsd).toBe(0);
    expect(result.changeUsdBs).toBe(0);
    expect(result.remainderBs).toBe(250);
  });
});

describe('suggestChangeBreakdown', () => {
  it('suggests the canonical breakdown for Bs 3650 of change at rate 850', () => {
    const result = suggestChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
    });

    expect(result.usdBills).toEqual({ 1: 4 });
    expect(result.changeUsd).toBe(4);
    expect(result.changeUsdBs).toBe(3400);
    expect(result.remainderBs).toBe(250);
  });

  it('never proposes a bill larger than maxDenomination', () => {
    const result = suggestChangeBreakdown({
      changeDueBs: 23 * 850,
      exchangeRate: 850,
      maxDenomination: 5,
    });

    expect(result.usdBills).toEqual({ 5: 4, 1: 3 });
    expect(result.usdBills[20]).toBeUndefined();
    expect(result.usdBills[10]).toBeUndefined();
    expect(sumUsdBills(result.usdBills)).toBe(23);
  });

  it('falls back to an all-Bs remainder when the change is smaller than one bill', () => {
    const result = suggestChangeBreakdown({
      changeDueBs: 400,
      exchangeRate: 850,
    });

    expect(result.usdBills).toEqual({});
    expect(result.remainderBs).toBe(400);
  });

  it('picks larger bills first when unconstrained', () => {
    const result = suggestChangeBreakdown({
      changeDueBs: 26 * 850,
      exchangeRate: 850,
    });

    expect(result.usdBills).toEqual({ 20: 1, 5: 1, 1: 1 });
  });

  it('throws when the exchange rate is not positive', () => {
    expect(() =>
      suggestChangeBreakdown({ changeDueBs: 100, exchangeRate: 0 })
    ).toThrow();
  });
});

describe('validateChangeBreakdown', () => {
  it('accepts a breakdown that does not exceed the change due', () => {
    const result = validateChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
      breakdown: {
        usdBills: { 1: 4 },
        changeUsd: 4,
        changeUsdBs: 3400,
        remainderBs: 250,
      },
    });

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('rejects a breakdown whose bills exceed the change due', () => {
    const result = validateChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
      breakdown: {
        usdBills: { 5: 1 },
        changeUsd: 5,
        changeUsdBs: 4250,
        remainderBs: -600,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects negative bill counts', () => {
    const result = validateChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
      breakdown: {
        usdBills: { 1: -1 },
        changeUsd: -1,
        changeUsdBs: -850,
        remainderBs: 4500,
      },
    });

    expect(result.ok).toBe(false);
  });

  it('rejects non-integer bill counts', () => {
    const result = validateChangeBreakdown({
      changeDueBs: 3650,
      exchangeRate: 850,
      breakdown: {
        usdBills: { 1: 1.5 },
        changeUsd: 1.5,
        changeUsdBs: 1275,
        remainderBs: 2375,
      },
    });

    expect(result.ok).toBe(false);
  });
});
