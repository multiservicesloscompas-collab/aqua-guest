import { describe, expect, it } from 'vitest';
import {
  buildRentalReference,
  buildSaleReference,
  buildTipPayoutReference,
} from './paymentMethodLinkedReference';

describe('paymentMethodLinkedReference', () => {
  it('falls back to the short sale id when daily number is not positive', () => {
    expect(
      buildSaleReference({
        id: 'sale-reference-1234',
        dailyNumber: 0,
      })
    ).toBe('Venta #sale-ref');
  });

  it('uses the canonical sale reference map for sale-origin tip payouts', () => {
    expect(
      buildTipPayoutReference(
        {
          originType: 'sale',
          originId: 'sale-1',
        },
        new Map([
          [
            'sale-1',
            {
              id: 'sale-1',
              dailyNumber: 15,
            },
          ],
        ])
      )
    ).toBe('Propina de Venta #15');
  });

  it('builds rental references from the canonical rental reference type', () => {
    expect(buildRentalReference({ id: 'rental-reference-1234' })).toBe(
      'Alquiler #rental-r'
    );
  });
});
