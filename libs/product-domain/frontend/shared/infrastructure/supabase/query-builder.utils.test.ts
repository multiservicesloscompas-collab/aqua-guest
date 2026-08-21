import { describe, expect, it, vi } from 'vitest';

import { applyGetAllQuery } from './apply-get-all-query';
import { validateWhereField } from './query-builder.utils';

const createQuery = () => {
  const query = {
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    gt: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    ilike: vi.fn(() => query),
    is: vi.fn(() => query),
    in: vi.fn(() => query),
    not: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    then: vi.fn(),
  };

  return query;
};

describe('query-builder comparison filters', () => {
  it('forwards string date values to comparative operators', () => {
    const query = createQuery();
    const table = {
      select: vi.fn(() => query),
    };

    applyGetAllQuery(table, {
      config: {
        table: 'sales',
        select: 'id, date',
      },
      input: {
        where: {
          fields: [
            { field: 'date', operator: '>=', value: '2026-03-01' },
            { field: 'date', operator: '<=', value: '2026-03-31T23:59:59.999Z' },
          ],
        },
      },
    });

    expect(query.gte).toHaveBeenCalledWith('date', '2026-03-01');
    expect(query.lte).toHaveBeenCalledWith('date', '2026-03-31T23:59:59.999Z');
  });

  it('normalizes Date values to ISO strings for comparative operators', () => {
    const query = createQuery();
    const table = {
      select: vi.fn(() => query),
    };
    const startDate = new Date('2026-03-01T10:30:00.000Z');

    applyGetAllQuery(table, {
      config: {
        table: 'sales',
        select: 'id, date',
      },
      input: {
        where: {
          fields: [{ field: 'date', operator: '>', value: startDate }],
        },
      },
    });

    expect(query.gt).toHaveBeenCalledWith('date', startDate.toISOString());
  });

  it('rejects boolean values for comparative operators', () => {
    expect(() =>
      validateWhereField({
        field: 'date',
        operator: '>=',
        value: true,
      })
    ).toThrow('>= requires a comparable value');
  });
});
