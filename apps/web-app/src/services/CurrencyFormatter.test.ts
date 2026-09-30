import { describe, expect, it } from 'vitest';
import { CurrencyFormatter } from './CurrencyService';

const inlineBs = (amount: number) =>
  `Bs ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

describe('CurrencyFormatter.formatBsWithSymbol', () => {
  it.each([0, 5, 1234.5, 1234567.891, -20, 0.005, 99.999])(
    'matches the inline es-VE two-decimal format for %s',
    (amount) => {
      // Arrange / Act
      const result = CurrencyFormatter.formatBsWithSymbol(amount);

      // Assert
      expect(result).toBe(inlineBs(amount));
    }
  );

  it('prefixes the amount with "Bs "', () => {
    // Arrange / Act
    const result = CurrencyFormatter.formatBsWithSymbol(100);

    // Assert
    expect(result.startsWith('Bs ')).toBe(true);
  });

  it('always shows two decimals by default', () => {
    // Arrange / Act
    const result = CurrencyFormatter.formatBsWithSymbol(100);

    // Assert
    expect(result).toBe(inlineBs(100));
    expect(result.endsWith(',00')).toBe(true);
  });

  it('honors a custom number of decimals', () => {
    // Arrange / Act
    const result = CurrencyFormatter.formatBsWithSymbol(1.2345, 3);

    // Assert
    expect(result).toBe(
      `Bs ${(1.2345).toLocaleString('es-VE', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })}`
    );
  });
});
