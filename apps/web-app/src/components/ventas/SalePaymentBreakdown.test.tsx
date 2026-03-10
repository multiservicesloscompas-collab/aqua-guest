import { Banknote } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { PaymentDisplayModel } from '@/services/payments/paymentDisplayModel';
import type { Sale } from '@/types';

import { SalePaymentBreakdown } from './SalePaymentBreakdown';

const baseSale: Sale = {
  id: 'sale-1',
  dailyNumber: 1,
  date: '2026-03-10',
  items: [],
  paymentMethod: 'efectivo',
  totalBs: 100,
  totalUsd: 2,
  exchangeRate: 50,
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
};

describe('SalePaymentBreakdown', () => {
  it('renders mixed split lines with Bs and USD amounts', () => {
    const paymentDisplay: PaymentDisplayModel = {
      kind: 'mixed',
      label: 'Pago mixto',
      primaryMethod: 'efectivo',
      lines: [
        {
          method: 'efectivo',
          label: 'Efectivo',
          amountBs: 70,
          amountUsd: 1.4,
        },
        {
          method: 'pago_movil',
          label: 'Pago Móvil',
          amountBs: 30,
          amountUsd: 0.6,
        },
      ],
      totalBs: 100,
      totalUsd: 2,
    };

    render(
      <SalePaymentBreakdown
        sale={baseSale}
        paymentDisplay={paymentDisplay}
        timeLabel="10:00"
        paymentIcon={Banknote}
      />
    );

    expect(
      screen.getByTestId('sale-mixed-breakdown-sale-1')
    ).toBeInTheDocument();
    expect(screen.getByText('Efectivo: Bs 70.00 • $1.40')).toBeInTheDocument();
    expect(
      screen.getByText('Pago Móvil: Bs 30.00 • $0.60')
    ).toBeInTheDocument();
    expect(screen.getByTestId('sale-price-sale-1')).toBeInTheDocument();
  });
});
