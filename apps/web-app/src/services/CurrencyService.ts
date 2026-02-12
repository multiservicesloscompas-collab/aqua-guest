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

/**
 * Crea un convertidor de moneda con una tasa específica
 */
export function createCurrencyConverter(exchangeRate: number): CurrencyConverter {
  return {
    /**
     * Convierte Bolívares a USD
     */
    toUsd(bs: number): number {
      if (!exchangeRate || exchangeRate <= 0) return 0;
      return bs / exchangeRate;
    },

    /**
     * Convierte USD a Bolívares
     */
    toBs(usd: number): number {
      if (!exchangeRate || exchangeRate <= 0) return 0;
      return usd * exchangeRate;
    },

    /**
     * Formatea un monto en Bolívares
     */
    formatBs(amount: number, fractionDigits: number = 2): string {
      return amount.toLocaleString('es-VE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    },

    /**
     * Formatea un monto en USD
     */
    formatUsd(amount: number, fractionDigits: number = 2): string {
      return amount.toLocaleString('es-VE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    },
  };
}

/**
 * Funciones utilitarias estáticas para formateo
 */
export const CurrencyFormatter = {
  /**
   * Formatea un monto en Bolívares con el símbolo
   */
  formatBsWithSymbol(amount: number, fractionDigits: number = 2): string {
    return `Bs ${amount.toLocaleString('es-VE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  },

  /**
   * Formatea un monto en USD con el símbolo
   */
  formatUsdWithSymbol(amount: number, fractionDigits: number = 2): string {
    return `$${amount.toLocaleString('es-VE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  },

  /**
   * Formatea un monto según la moneda seleccionada
   */
  formatByCurrency(
    amount: number,
    currency: 'Bs' | 'USD',
    exchangeRate: number,
    fractionDigits: number = 2
  ): string {
    if (currency === 'USD') {
      const usd = exchangeRate > 0 ? amount / exchangeRate : 0;
      return CurrencyFormatter.formatUsdWithSymbol(usd, fractionDigits);
    }
    return CurrencyFormatter.formatBsWithSymbol(amount, fractionDigits);
  },
};
