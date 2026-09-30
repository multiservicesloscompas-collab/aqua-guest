const TZ = 'America/Caracas';

/** Current calendar date in Caracas as YYYY-MM-DD (matches the app's getVenezuelaDate). */
export function todayVe(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: TZ });
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Next date (>= from) that falls on a Sunday. */
export function nextSunday(from: string): string {
  const [y, m, d] = from.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(from, (7 - dow) % 7);
}

export function firstDayOfPreviousMonth(from: string): string {
  const [y, m] = from.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return prev.toISOString().slice(0, 10);
}

export function lastDayOfPreviousMonth(from: string): string {
  const [y, m] = from.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1, 0));
  return last.toISOString().slice(0, 10);
}
