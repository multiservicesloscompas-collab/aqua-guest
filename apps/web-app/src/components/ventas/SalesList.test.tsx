import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { Sale } from '@/types';
import type { Tip } from '@/types/tips';

import { SalesList } from './SalesList';

const tipState = {
  tips: [] as Tip[],
};

vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => ({
    deleteSale: vi.fn(),
  }),
}));

vi.mock('@/store/useTipStore', () => ({
  useTipStore: (selector?: (state: typeof tipState) => unknown) =>
    selector ? selector(tipState) : tipState,
}));

vi.mock('@/services/payments/paymentDisplayModel', () => ({
  buildSalePaymentDisplayModel: () => ({
    kind: 'single',
    label: 'Efectivo',
    primaryMethod: 'efectivo',
    lines: [],
    totalBs: 0,
    totalUsd: 0,
  }),
}));

vi.mock('@/services/payments/paymentSplitValidity', () => ({
  hasValidMixedPaymentSplits: () => false,
}));

vi.mock('@/lib/date-utils', () => ({
  getSafeTimestampForSorting: () => Date.parse('2026-03-13T10:00:00.000Z'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('./EditSaleSheet', () => ({
  EditSaleSheet: () => null,
}));

vi.mock('./SalePaymentBreakdown', () => ({
  SalePaymentBreakdown: ({ sale }: { sale: Sale }) => (
    <div data-testid={`sale-breakdown-${sale.id}`}>Breakdown</div>
  ),
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerClose: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const baseSale: Sale = {
  id: 'sale-1',
  dailyNumber: 1,
  date: '2026-03-13',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Recarga de Agua',
      quantity: 1,
      liters: 19,
      unitPrice: 100,
      subtotal: 100,
    },
  ],
  paymentMethod: 'efectivo',
  totalBs: 120,
  totalUsd: 2.4,
  exchangeRate: 50,
  createdAt: '2026-03-13T10:00:00.000Z',
  updatedAt: '2026-03-13T10:00:00.000Z',
};

describe('SalesList', () => {
  it('renders linked tip amount instead of inferring from stale item subtotal', () => {
    tipState.tips = [
      {
        id: 'tip-1',
        originType: 'sale',
        originId: 'sale-1',
        tipDate: '2026-03-13',
        amountBs: 200,
        capturePaymentMethod: 'efectivo',
        status: 'pending',
        createdAt: '2026-03-13T10:00:00.000Z',
        updatedAt: '2026-03-13T10:00:00.000Z',
      },
    ];

    render(
      <SalesList
        sales={[
          {
            ...baseSale,
            totalBs: 560,
            totalUsd: 11.2,
            items: [
              {
                ...baseSale.items[0],
                unitPrice: 300,
                subtotal: 300,
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('Propina Bs 200.00')).toBeInTheDocument();
    expect(screen.queryByText('Propina Bs 260.00')).not.toBeInTheDocument();
  });

  it('renders tip badge label when sale includes tip', () => {
    tipState.tips = [];
    render(<SalesList sales={[baseSale]} />);

    expect(screen.getByText('1x Recarga de Agua (19L)')).toBeInTheDocument();

    const tipBadge = screen.getByText('Propina Bs 20.00');
    expect(tipBadge).toBeInTheDocument();
    expect(tipBadge).toHaveClass('bg-black', 'text-white');
    expect(tipBadge).not.toHaveClass('font-bold');
  });

  it('does not render tip badge when tip is zero', () => {
    tipState.tips = [];
    render(
      <SalesList
        sales={[
          {
            ...baseSale,
            id: 'sale-2',
            totalBs: 100,
            totalUsd: 2,
          },
        ]}
      />
    );

    expect(screen.queryByText(/Propina .*Bs/)).not.toBeInTheDocument();
  });
});
