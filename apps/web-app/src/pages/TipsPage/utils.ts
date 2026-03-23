import type { Sale, WasherRental } from '@/types';

const BOLIVAR_FORMATTER = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-VE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatBolivars(amount: number): string {
  return BOLIVAR_FORMATTER.format(amount);
}

export function formatTipsDateLabel(date: string): string {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const formatted = DATE_FORMATTER.format(parsedDate);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function resolveTipOriginLabel(
  originType: 'sale' | 'rental',
  originId: string,
  salesById: Map<string, Pick<Sale, 'dailyNumber'>>,
  rentalsById: Map<string, Pick<WasherRental, 'customerName'>>
) {
  if (originType === 'sale') {
    const sale = salesById.get(originId);
    if (sale) {
      return `Venta #${sale.dailyNumber}`;
    }
  }

  if (originType === 'rental') {
    const rental = rentalsById.get(originId);
    if (rental?.customerName?.trim()) {
      return `Alquiler - ${rental.customerName}`;
    }
  }

  return `Origen no disponible (${originType}: ${originId})`;
}
