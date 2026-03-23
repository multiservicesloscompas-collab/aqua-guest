import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExpensesPage } from './ExpensesPage';

const mocks = vi.hoisted(() => ({
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  loadExpensesByDate: vi.fn().mockResolvedValue(undefined),
  loadTipsByDateRange: vi.fn().mockResolvedValue(undefined),
  setSelectedDate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const baseExpense = {
  id: 'expense-1',
  date: '2026-03-20',
  description: 'Egreso existente',
  amount: 100,
  category: 'operativo' as const,
  paymentMethod: 'efectivo' as const,
  notes: 'nota',
  createdAt: '2026-03-20T10:00:00.000Z',
};

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => ({
    viewportMode: 'mobile',
    isMobileViewport: true,
    isTabletViewport: false,
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    selectedDate: '2026-03-20',
    setSelectedDate: mocks.setSelectedDate,
  }),
}));

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: () => ({
    config: { exchangeRate: 50 },
    mixedPaymentFlags: {
      enabled: true,
      water: true,
      rentals: true,
      expenses: true,
    },
  }),
}));

vi.mock('@/store/useTipStore', () => ({
  useTipStore: () => ({
    tipPayouts: [],
    loadTipsByDateRange: mocks.loadTipsByDateRange,
  }),
}));

vi.mock('@/store/useExpenseStore', () => ({
  useExpenseStore: () => ({
    getExpensesByDate: () => [baseExpense],
    loadExpensesByDate: mocks.loadExpensesByDate,
    addExpense: mocks.addExpense,
    updateExpense: mocks.updateExpense,
    deleteExpense: mocks.deleteExpense,
  }),
}));

vi.mock('./ExpensesPage/components/ExpensesMobileHeaderControls', () => ({
  ExpensesMobileHeaderControls: () => <div>Controls</div>,
}));

vi.mock('./ExpensesPage/components/ExpensesDayTotalCard', () => ({
  ExpensesDayTotalCard: () => <div>Total</div>,
}));

vi.mock('./ExpensesPage/components/ExpensesTabletSidebar', () => ({
  ExpensesTabletSidebar: () => <div>Sidebar</div>,
}));

vi.mock('./ExpensesPage/components/ExpensesContent', () => ({
  ExpensesContent: ({
    expenses,
    onEdit,
  }: {
    expenses: (typeof baseExpense)[];
    onEdit: (expense: typeof baseExpense) => void;
  }) => (
    <div>
      <span data-testid="expenses-count">{expenses.length}</span>
      <button type="button" onClick={() => onEdit(expenses[0])}>
        edit-first
      </button>
    </div>
  ),
}));

vi.mock('./ExpensesPage/components/ExpensesSheet', () => ({
  ExpensesSheet: ({
    description,
    amount,
    paymentMethod,
    isMixedPayment,
    secondaryMethod,
    onDescriptionChange,
    onAmountChange,
    onPaymentMethodChange,
    onIsMixedPaymentChange,
    onSecondaryMethodChange,
    onMixedAmountInputChange,
    onSubmit,
  }: {
    description: string;
    amount: string;
    paymentMethod: string;
    isMixedPayment: boolean;
    secondaryMethod: string;
    onDescriptionChange: (value: string) => void;
    onAmountChange: (value: string) => void;
    onPaymentMethodChange: (value: 'pago_movil' | 'efectivo') => void;
    onIsMixedPaymentChange: (value: boolean) => void;
    onSecondaryMethodChange: (value: 'pago_movil' | 'efectivo') => void;
    onMixedAmountInputChange: (value: string) => void;
    onSubmit: () => void;
  }) => (
    <div>
      <span data-testid="sheet-description">{description}</span>
      <span data-testid="sheet-amount">{amount}</span>
      <span data-testid="sheet-primary-method">{paymentMethod}</span>
      <span data-testid="sheet-secondary-method">{secondaryMethod}</span>
      <span data-testid="sheet-is-mixed">{String(isMixedPayment)}</span>
      <button type="button" onClick={() => onDescriptionChange('Nuevo gasto')}>
        set-description
      </button>
      <button type="button" onClick={() => onAmountChange('100')}>
        set-amount-100
      </button>
      <button type="button" onClick={() => onAmountChange('-100')}>
        set-amount-invalid
      </button>
      <button type="button" onClick={() => onPaymentMethodChange('efectivo')}>
        set-primary-cash
      </button>
      <button type="button" onClick={() => onPaymentMethodChange('pago_movil')}>
        set-primary-mobile
      </button>
      <button type="button" onClick={() => onSecondaryMethodChange('efectivo')}>
        set-secondary-cash
      </button>
      <button
        type="button"
        onClick={() => onSecondaryMethodChange('pago_movil')}
      >
        set-secondary-mobile
      </button>
      <button type="button" onClick={() => onIsMixedPaymentChange(true)}>
        enable-mixed
      </button>
      <button type="button" onClick={() => onMixedAmountInputChange('30')}>
        set-secondary-amount-30
      </button>
      <button type="button" onClick={onSubmit}>
        submit-sheet
      </button>
    </div>
  ),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('ExpensesPage mixed payment submit behavior', () => {
  beforeEach(() => {
    mocks.addExpense.mockReset();
    mocks.updateExpense.mockReset();
    mocks.deleteExpense.mockReset();
    mocks.loadExpensesByDate.mockClear();
    mocks.loadTipsByDateRange.mockClear();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.addExpense.mockResolvedValue(undefined);
    mocks.updateExpense.mockResolvedValue(undefined);
  });

  it('shows error and blocks submit when mixed payload is invalid', async () => {
    const user = userEvent.setup();
    render(<ExpensesPage autoOpenAdd={true} />);

    await user.click(screen.getByRole('button', { name: 'set-description' }));
    await user.click(
      screen.getByRole('button', { name: 'set-amount-invalid' })
    );
    await user.click(screen.getByRole('button', { name: 'enable-mixed' }));
    await user.click(
      screen.getByRole('button', { name: 'set-secondary-amount-30' })
    );
    await user.click(screen.getByRole('button', { name: 'submit-sheet' }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        expect.stringContaining('Debe registrar al menos un método de pago.')
      );
    });
    expect(mocks.addExpense).not.toHaveBeenCalled();
    expect(mocks.updateExpense).not.toHaveBeenCalled();
  });

  it('auto-adjusts secondary method when primary collides in mixed mode', async () => {
    const user = userEvent.setup();
    render(<ExpensesPage autoOpenAdd={true} />);

    await user.click(screen.getByRole('button', { name: 'enable-mixed' }));
    await user.click(
      screen.getByRole('button', { name: 'set-primary-mobile' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('sheet-secondary-method')).toHaveTextContent(
        'efectivo'
      );
    });
  });

  it('sends two normalized splits on valid mixed create and edit', async () => {
    const user = userEvent.setup();
    render(<ExpensesPage autoOpenAdd={true} />);

    await user.click(screen.getByRole('button', { name: 'set-description' }));
    await user.click(screen.getByRole('button', { name: 'set-amount-100' }));
    await user.click(screen.getByRole('button', { name: 'enable-mixed' }));
    await user.click(
      screen.getByRole('button', { name: 'set-secondary-amount-30' })
    );
    await user.click(screen.getByRole('button', { name: 'submit-sheet' }));

    await waitFor(() => {
      expect(mocks.addExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'efectivo',
          paymentSplits: [
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
        })
      );
    });

    await user.click(screen.getByRole('button', { name: 'edit-first' }));
    await user.click(screen.getByRole('button', { name: 'enable-mixed' }));
    await user.click(
      screen.getByRole('button', { name: 'set-secondary-amount-30' })
    );
    await user.click(screen.getByRole('button', { name: 'submit-sheet' }));

    await waitFor(() => {
      expect(mocks.updateExpense).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({
          paymentMethod: 'efectivo',
          paymentSplits: [
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
        })
      );
    });
  });
});
