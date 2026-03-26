const DEFAULT_SEED = 20260323;

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return DEFAULT_SEED;
  }

  return (Math.abs(Math.floor(seed)) || DEFAULT_SEED) >>> 0;
}

export function resolveMatrixSeedFromEnv(): number {
  const raw = process.env.E2E_TIPS_MATRIX_SEED;
  if (!raw) {
    return DEFAULT_SEED;
  }

  const parsed = Number.parseInt(raw, 10);
  return normalizeSeed(parsed);
}

export function createSeededRng(seed: number): () => number {
  let state = normalizeSeed(seed) || DEFAULT_SEED;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

export function nextIntInclusive(
  nextRandom: () => number,
  min: number,
  max: number
): number {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  const span = safeMax - safeMin + 1;
  return safeMin + Math.floor(nextRandom() * span);
}
