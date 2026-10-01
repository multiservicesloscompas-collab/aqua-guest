import { describe, expect, it } from 'vitest';
import { isValidExpenseAmount } from './expenseAmount';

describe('isValidExpenseAmount (FIN-10)', () => {
  it.each(['0', '0.00', '-5', '', '   ', 'abc', 'NaN', 'Infinity'])(
    'rejects %j',
    (input) => {
      expect(isValidExpenseAmount(input)).toBe(false);
    }
  );

  it.each(['1', '0.01', '30', '1500.5'])('accepts %j', (input) => {
    expect(isValidExpenseAmount(input)).toBe(true);
  });
});
