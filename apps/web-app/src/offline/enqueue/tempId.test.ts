import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateTempId } from './tempId';

describe('generateTempId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes the id with "temp-"', () => {
    // Arrange / Act
    const id = generateTempId();

    // Assert
    expect(id.startsWith('temp-')).toBe(true);
  });

  it('uses up to 13 base-36 characters after the prefix', () => {
    // Arrange / Act
    const id = generateTempId();

    // Assert
    expect(id).toMatch(/^temp-[a-z0-9]{1,13}$/);
  });

  it('derives the suffix from Math.random in base 36', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Act
    const id = generateTempId();

    // Assert
    expect(id).toBe(`temp-${(0.5).toString(36).substring(2, 15)}`);
  });

  it('returns a different id on consecutive calls', () => {
    // Arrange / Act
    const ids = new Set(Array.from({ length: 50 }, () => generateTempId()));

    // Assert
    expect(ids.size).toBe(50);
  });
});
