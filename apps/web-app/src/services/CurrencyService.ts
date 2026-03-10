/**
 * Servicio de conversión de moneda
 * Centraliza la lógica de conversión entre Bolívares y USD
 */

export interface CurrencyConverter {
  toUsd(bs: number): number;
  toBs(usd: number): number;
  formatBs(amount: number, fractionDigits?: number): string;
  formatUsd(amount: number, fractionDigits?: number): string;
}

export function createCurrencyConverter(
  exchangeRate: number
): CurrencyConverter {
  return {
    toUsd(bs: number): number {
      if (!exchangeRate || exchangeRate <= 0) return 0;
      return bs / exchangeRate;
    },

    toBs(usd: number): number {
      if (!exchangeRate || exchangeRate <= 0) return 0;
      return usd * exchangeRate;
    },

    formatBs(amount: number, fractionDigits = 2): string {
      return amount.toLocaleString('es-VE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    },

    formatUsd(amount: number, fractionDigits = 2): string {
      return amount.toLocaleString('es-VE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    },
  };
}

export const CurrencyFormatter = {
  formatBsWithSymbol(amount: number, fractionDigits = 2): string {
    return `Bs ${amount.toLocaleString('es-VE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  },

  formatUsdWithSymbol(amount: number, fractionDigits = 2): string {
    return `$${amount.toLocaleString('es-VE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  },

  formatByCurrency(
    amount: number,
    currency: 'Bs' | 'USD',
    exchangeRate: number,
    fractionDigits = 2
  ): string {
    if (currency === 'USD') {
      const usd = exchangeRate > 0 ? amount / exchangeRate : 0;
      return CurrencyFormatter.formatUsdWithSymbol(usd, fractionDigits);
    }
    return CurrencyFormatter.formatBsWithSymbol(amount, fractionDigits);
  },
};
