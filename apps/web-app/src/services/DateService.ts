const VENEZUELA_TIMEZONE = 'America/Caracas';

export function getVenezuelaDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: VENEZUELA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export interface IDateService {
  getCurrentDate(): string;
  normalizeSaleDate(selectedDate: string): string;
  isSameDate(date1: string, date2: string): boolean;
}

export class DateService implements IDateService {
  getCurrentDate(): string {
    return getVenezuelaDate();
  }

  normalizeSaleDate(selectedDate: string): string {
    if (!selectedDate) return this.getCurrentDate();
    return selectedDate.substring(0, 10);
  }

  isSameDate(date1: string, date2: string): boolean {
    return date1 === date2;
  }
}

export const dateService = new DateService();
