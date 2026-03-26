export function parseBsAmount(text: string): number {
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/Bs\.?/gi, '')
    .replace(/\$/g, '')
    .trim();

  const match = normalized.match(/-?[\d.,]+/);
  if (!match) {
    return 0;
  }

  const value = match[0].replace(/\./g, '').replace(',', '.');
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
