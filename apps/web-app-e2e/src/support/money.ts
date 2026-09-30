export function parseUniversalMoney(text: string): number {
  if (!text) return 0;

  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/Bs\.?/gi, '')
    .replace(/USD/gi, '')
    .replace(/\$/g, '')
    .trim();

  const match = normalized.match(/-?[\d.,]+/);
  if (!match) {
    return 0;
  }

  const raw = match[0];
  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;

  let parsed = 0;
  if (unsigned.includes('.') && unsigned.includes(',')) {
    const lastDot = unsigned.lastIndexOf('.');
    const lastComma = unsigned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Venezuelan / European: 1.234,56
      parsed = Number(unsigned.replace(/\./g, '').replace(',', '.'));
    } else {
      // US standard: 1,234.56
      parsed = Number(unsigned.replace(/,/g, ''));
    }
  } else if (unsigned.includes(',')) {
    parsed = Number(unsigned.replace(',', '.'));
  } else if (unsigned.includes('.')) {
    const parts = unsigned.split('.');
    if (parts.length > 2) {
      // 1.000.000
      parsed = Number(unsigned.replace(/\./g, ''));
    } else if (parts[1].length === 1 || parts[1].length === 2) {
      // 250.00 or 250.5
      parsed = Number(unsigned);
    } else {
      // 1.000 (thousands separator in es-VE)
      parsed = Number(unsigned.replace(/\./g, ''));
    }
  } else {
    parsed = Number(unsigned);
  }

  const result = isNegative ? -parsed : parsed;
  return Number.isFinite(result) ? result : 0;
}

export function parseBsAmount(text: string): number {
  return parseUniversalMoney(text);
}
