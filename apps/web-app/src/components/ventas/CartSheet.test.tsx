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

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerClose: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

    await user.click(screen.getByRole('button', { name: /pago mixto/i }));

    expect(
      screen.getByText(/Dividir cobro en dos métodos/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Quitar/i)).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Monto método secundario/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Monto método principal: Bs 100.00')
    ).toBeInTheDocument();
  });

  it('sends primary amount as total minus secondary input', async () => {
    const user = userEvent.setup();

    render(<CartSheet open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /pago mixto/i }));

    const secondaryAmountInput = screen.getByLabelText(/Monto método secundario/i);
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
        ],
        undefined
      );
    });
  });

  it('sends tip payload when tip capture is enabled', async () => {
    const user = userEvent.setup();

    render(<CartSheet open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /propina/i }));

    const amountInput = screen.getByPlaceholderText('Ej: 20.00...');
    await user.type(amountInput, '20');

    await user.click(screen.getByRole('button', { name: 'Confirmar Venta' }));

    await waitFor(() => {
      expect(mockCompleteSale).toHaveBeenCalledWith(
        'efectivo',
        '2026-03-07',
        undefined,
        [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2.0,
            exchangeRateUsed: 50,
          },
        ],
        {
          amountBs: 20,
          capturePaymentMethod: 'efectivo',
          notes: undefined,
        }
      );
    });
  });
});
