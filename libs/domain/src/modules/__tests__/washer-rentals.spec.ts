import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RENTAL_SHIFT,
  SHIFT_FALLBACKS,
  SHIFT_UUID,
  resolveShiftConfig,
} from '../washer-rentals';
import type { RentalShiftConfig } from '../washer-rentals';

const buildCatalog = (): RentalShiftConfig[] => [
  {
    id: 'shift-a',
    label: 'Turno A',
    priceUsd: 7,
    hours: 12,
    hasDivisaDiscount: true,
    divisaDiscountAmount: 2,
    isActive: true,
  },
  {
    id: 'shift-b',
    label: 'Turno B',
    priceUsd: 9,
    hours: 36,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 0,
    isActive: false,
  },
];

describe('SHIFT_UUID', () => {
  it('exposes the deterministic UUIDs seeded by the migration', () => {
    expect(SHIFT_UUID.medio).toBe('d1111111-1111-1111-1111-111111111111');
    expect(SHIFT_UUID.completo).toBe('d2222222-2222-2222-2222-222222222222');
    expect(SHIFT_UUID.doble).toBe('d3333333-3333-3333-3333-333333333333');
  });
});

describe('SHIFT_FALLBACKS', () => {
  it('exposes a fallback for every legacy key', () => {
    expect(SHIFT_FALLBACKS.medio).toMatchObject({
      id: SHIFT_UUID.medio,
      label: 'Medio Turno',
      hours: 8,
      priceUsd: 4,
    });
    expect(SHIFT_FALLBACKS.completo).toMatchObject({
      id: SHIFT_UUID.completo,
      label: 'Completo',
      hours: 24,
      priceUsd: 6,
      hasDivisaDiscount: true,
    });
    expect(SHIFT_FALLBACKS.doble).toMatchObject({
      id: SHIFT_UUID.doble,
      label: 'Doble',
      hours: 48,
      priceUsd: 12,
    });
  });

  it('exposes the same configs under their UUID keys', () => {
    expect(SHIFT_FALLBACKS[SHIFT_UUID.medio]).toEqual(SHIFT_FALLBACKS.medio);
    expect(SHIFT_FALLBACKS[SHIFT_UUID.completo]).toEqual(
      SHIFT_FALLBACKS.completo
    );
    expect(SHIFT_FALLBACKS[SHIFT_UUID.doble]).toEqual(SHIFT_FALLBACKS.doble);
  });
});

describe('DEFAULT_RENTAL_SHIFT', () => {
  it('points at the "completo" fallback', () => {
    expect(DEFAULT_RENTAL_SHIFT).toEqual(SHIFT_FALLBACKS.completo);
  });
});

describe('resolveShiftConfig', () => {
  it('returns null for nullish input', () => {
    expect(resolveShiftConfig(null)).toBeNull();
    expect(resolveShiftConfig(undefined)).toBeNull();
    expect(resolveShiftConfig('')).toBeNull();
  });

  it('resolves legacy keys through the offline fallback', () => {
    expect(resolveShiftConfig('medio')).toEqual(SHIFT_FALLBACKS.medio);
    expect(resolveShiftConfig('completo')).toEqual(SHIFT_FALLBACKS.completo);
    expect(resolveShiftConfig('doble')).toEqual(SHIFT_FALLBACKS.doble);
  });

  it('resolves UUID keys through the offline fallback', () => {
    expect(resolveShiftConfig(SHIFT_UUID.medio)).toEqual(
      SHIFT_FALLBACKS.medio
    );
    expect(resolveShiftConfig(SHIFT_UUID.completo)).toEqual(
      SHIFT_FALLBACKS.completo
    );
    expect(resolveShiftConfig(SHIFT_UUID.doble)).toEqual(
      SHIFT_FALLBACKS.doble
    );
  });

  it('prefers the dynamic catalog when provided', () => {
    const catalog = buildCatalog();
    const result = resolveShiftConfig('shift-a', catalog);

    expect(result).toEqual(catalog[0]);
  });

  it('falls back to the offline catalog when the dynamic one does not contain the id', () => {
    const catalog = buildCatalog();
    const result = resolveShiftConfig('medio', catalog);

    expect(result).toEqual(SHIFT_FALLBACKS.medio);
  });

  it('returns null when neither source knows the id', () => {
    expect(resolveShiftConfig('unknown-shift')).toBeNull();
    expect(resolveShiftConfig('unknown-shift', buildCatalog())).toBeNull();
  });

  it('does not throw when the dynamic catalog is empty', () => {
    expect(resolveShiftConfig('medio', [])).toEqual(SHIFT_FALLBACKS.medio);
  });
});
