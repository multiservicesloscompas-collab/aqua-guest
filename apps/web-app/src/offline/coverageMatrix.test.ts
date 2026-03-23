import { describe, expect, it } from 'vitest';
import {
  OFFLINE_COVERAGE_MATRIX,
  OFFLINE_MUTATION_TABLES,
} from './coverageMatrix';

const REQUIRED_TABLES = [
  'companies',
  'user_profiles',
  'customers',
  'products',
  'sales',
  'sale_payment_splits',
  'washer_rentals',
  'rental_payment_splits',
  'prepaid_orders',
  'expenses',
  'expense_payment_splits',
  'exchange_rates',
  'liter_pricing',
  'washing_machines',
  'payment_balance_transactions',
];

describe('offline/coverageMatrix', () => {
  it('contains every required table exactly once', () => {
    const tables = OFFLINE_COVERAGE_MATRIX.map((entry) => entry.table);

    expect(new Set(tables).size).toBe(REQUIRED_TABLES.length);
    expect(new Set(tables)).toEqual(new Set(REQUIRED_TABLES));
  });

  it('exposes offline mutation table list', () => {
    expect(OFFLINE_MUTATION_TABLES).toContain('sales');
    expect(OFFLINE_MUTATION_TABLES).not.toContain('companies');
    expect(OFFLINE_MUTATION_TABLES).not.toContain('products');
  });
});
