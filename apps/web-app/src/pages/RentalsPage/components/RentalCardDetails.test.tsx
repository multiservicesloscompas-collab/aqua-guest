import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Banknote } from 'lucide-react';

import type { PaymentDisplayModel } from '@/services/payments/paymentDisplayModel';
import type { WasherRental } from '@/types';
import type { Tip } from '@/types/tips';

import { RentalCardDetails } from './RentalCardDetails';

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: (
    selector: (state: { config: { exchangeRate: number } }) => unknown
  ) => selector({ config: { exchangeRate: 50 } }),
}));

const baseRental: WasherRental = {
  id: 'rental-1',
  date: '2026-03-10',
  customerName: 'Cliente Demo',
  customerPhone: '000',
  customerAddress: 'Av. Principal',
  machineId: 'machine-1',
  shift: 'medio',
  deliveryTime: '09:00',
  pickupTime: '13:00',
  pickupDate: '2026-03-10',
  deliveryFee: 0,
  totalUsd: 5,
  paymentMethod: 'efectivo',
  status: 'agendado',
  isPaid: false,
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
};

describe('RentalCardDetails', () => {
  it('prefers linked rental tip and derives display subtotal from total', () => {
    const paymentDisplay: PaymentDisplayModel = {
      kind: 'single',
      label: 'Efectivo',
      primaryMethod: 'efectivo',
      lines: [],
      totalBs: 0,
      totalUsd: 6,
    };

    const linkedTip: Tip = {
      id: 'tip-1',
      originType: 'rental',
      originId: 'rental-1',
      tipDate: '2026-03-10',
      amountBs: 50,
      capturePaymentMethod: 'pago_movil',
      status: 'pending',
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    };

    render(
      <RentalCardDetails
        rental={{
          ...baseRental,
          totalUsd: 6,
        }}
        tip={linkedTip}
        paymentIcon={Banknote}
        paymentDisplay={paymentDisplay}
      />
    );

    expect(
      screen.getByText('Subtotal $5.00 + Propina Bs 50.00')
    ).toBeInTheDocument();
  });

  it('renders mixed split lines with Bs and USD amounts', () => {
    const paymentDisplay: PaymentDisplayModel = {
      kind: 'mixed',
      label: 'Pago mixto',
      primaryMethod: 'efectivo',
      lines: [
        {
          method: 'efectivo',
          label: 'Efectivo',
          amountBs: 150,
          amountUsd: 3,
        },
        {
          method: 'pago_movil',
          label: 'Pago Móvil',
          amountBs: 50,
          amountUsd: 1,
        },
      ],
      totalBs: 200,
      totalUsd: 4,
    };

    render(
      <RentalCardDetails
        rental={baseRental}
        paymentIcon={Banknote}
        paymentDisplay={paymentDisplay}
      />
    );

    expect(
      screen.getByTestId('rental-mixed-breakdown-rental-1')
    ).toBeInTheDocument();
    expect(screen.getByText('Efectivo: Bs 150.00 • $3.00')).toBeInTheDocument();
    expect(
      screen.getByText('Pago Móvil: Bs 50.00 • $1.00')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Subtotal $4.00 + Propina Bs 50.00')
    ).toBeInTheDocument();
  });
});
