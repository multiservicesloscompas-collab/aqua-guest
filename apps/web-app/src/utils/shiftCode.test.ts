import { describe, expect, it } from 'vitest';
import { isValidShiftCode, toShiftCode } from './shiftCode';

describe('toShiftCode', () => {
  it.each([
    ['Nocturno', 'NOCTURNO'],
    ['Turno Nocturno', 'TURNO_NOCTURNO'],
    ['  turno   express  ', 'TURNO_EXPRESS'],
    ['Medio-Día', 'MEDIO_DIA'],
    ['Niño Ñandú', 'NINO_NANDU'],
    ['Turno 2x1', 'TURNO_2X1'],
    ['**Súper!!  Oferta**', 'SUPER_OFERTA'],
  ])('derives %j as %s', (label, expected) => {
    // Arrange / Act
    const code = toShiftCode(label, []);

    // Assert
    expect(code).toBe(expected);
  });

  it('prefixes a code that would start with a digit', () => {
    // Arrange / Act
    const code = toShiftCode('24 horas', []);

    // Assert
    expect(code).toBe('TURNO_24_HORAS');
  });

  it('adds a numeric suffix while the code is taken', () => {
    // Arrange
    const existing = ['NOCTURNO', 'NOCTURNO_2'];

    // Act
    const code = toShiftCode('Nocturno', existing);

    // Assert
    expect(code).toBe('NOCTURNO_3');
  });

  it('compares existing codes ignoring case', () => {
    // Arrange / Act
    const code = toShiftCode('Nocturno', ['nocturno']);

    // Assert
    expect(code).toBe('NOCTURNO_2');
  });

  it.each(['', '   ', '!!!', '---'])(
    'returns undefined when %j has no usable characters',
    (label) => {
      // Arrange / Act / Assert
      expect(toShiftCode(label, [])).toBeUndefined();
    }
  );
});

describe('isValidShiftCode', () => {
  it.each(['MEDIO', 'TURNO_2', 'A1_B2'])('accepts %s', (code) => {
    // Arrange / Act / Assert
    expect(isValidShiftCode(code)).toBe(true);
  });

  it.each(['', 'medio', '1ABC', 'TURNO-2', '_X', 'TURNO 2'])(
    'rejects %j',
    (code) => {
      // Arrange / Act / Assert
      expect(isValidShiftCode(code)).toBe(false);
    }
  );
});
