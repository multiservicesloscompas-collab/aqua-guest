const SHIFT_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const LEADING_DIGIT_PATTERN = /^[0-9]/;
const COMBINING_MARKS_PATTERN = /[̀-ͯ]/g;
const NON_CODE_CHARACTERS_PATTERN = /[^A-Z0-9]+/g;
const EDGE_UNDERSCORES_PATTERN = /^_+|_+$/g;
const DIGIT_LEADING_PREFIX = 'TURNO_';
const FIRST_SUFFIX = 2;

export function isValidShiftCode(code: string): boolean {
  return SHIFT_CODE_PATTERN.test(code);
}

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toUpperCase()
    .replace(NON_CODE_CHARACTERS_PATTERN, '_')
    .replace(EDGE_UNDERSCORES_PATTERN, '');
}

export function toShiftCode(
  label: string,
  existingCodes: ReadonlyArray<string>
): string | undefined {
  const normalized = normalizeLabel(label);
  if (normalized === '') return undefined;

  const base = LEADING_DIGIT_PATTERN.test(normalized)
    ? `${DIGIT_LEADING_PREFIX}${normalized}`
    : normalized;
  const taken = new Set(existingCodes.map((code) => code.toUpperCase()));

  let candidate = base;
  let suffix = FIRST_SUFFIX;
  while (taken.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}
