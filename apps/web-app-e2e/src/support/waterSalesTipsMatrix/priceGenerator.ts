import { nextIntInclusive } from './seededRng';

const MIN_PRICE_BS = 80;
const MAX_PRICE_BS = 2000;

export function generateBoundedPrices(
  count: number,
  nextRandom: () => number
): number[] {
  if (count <= 0) {
    return [];
  }

  const prices: number[] = [MIN_PRICE_BS];

  if (count > 1) {
    prices.push(MAX_PRICE_BS);
  }

  while (prices.length < count) {
    prices.push(nextIntInclusive(nextRandom, MIN_PRICE_BS, MAX_PRICE_BS));
  }

  return prices;
}
