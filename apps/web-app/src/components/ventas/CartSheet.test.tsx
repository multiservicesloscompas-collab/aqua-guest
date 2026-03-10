import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { CartSheet } from './CartSheet';

const mockCompleteSale = vi.fn();
const mockRemoveFromCart = vi.fn();

const mockWaterSalesState = {
  cart: [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Botellón 19L',
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
    },
  ],
  removeFromCart: mockRemoveFromCart,
  completeSale: mockCompleteSale,
};

const mockConfigState = {
  config: {
    exchangeRate: 50,
  },
};

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    selectedDate: '2026-03-07',
  }),
}));

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: (selector?: (state: typeof mockConfigState) => unknown) =>
    selector ? selector(mockConfigState) : mockConfigState,
}));

vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => mockWaterSalesState,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CartSheet mixed payment UX', () => {
  beforeEach(() => {
    mockCompleteSale.mockReset();
    mockRemoveFromCart.mockReset();
    mockCompleteSale.mockResolvedValue({ id: 'sale-1' });
  });

  it('reveals mixed payment controls only after pressing "Pago mixto" button', async () => {
    const user = userEvent.setup();

    render(<CartSheet open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.queryByPlaceholderText('Monto método secundario (Bs)')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pago mixto' }));

    expect(
      screen.getByText('Divide el cobro entre dos métodos')
    ).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Monto método secundario (Bs)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Monto método principal: Bs 100.00')
    ).toBeInTheDocument();
  });

  it('sends primary amount as total minus secondary input', async () => {
    const user = userEvent.setup();

    render(<CartSheet open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Pago mixto' }));

    const secondaryAmountInput = screen.getByPlaceholderText(
      'Monto método secundario (Bs)'
    );
    await user.clear(secondaryAmountInput);
    await user.type(secondaryAmountInput, '30');

    await user.click(screen.getByRole('button', { name: 'Confirmar Venta' }));

    await waitFor(() => {
      expect(mockCompleteSale).toHaveBeenCalledWith(
        'efectivo',
        '2026-03-07',
        undefined,
        [
          {
            method: 'efectivo',
            amountBs: 70,
            amountUsd: 1.4,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 30,
            amountUsd: 0.6,
            exchangeRateUsed: 50,
          },
        ]
      );
    });
  });
});
