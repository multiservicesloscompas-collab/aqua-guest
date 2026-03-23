import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ExpensesPage } from './ExpensesPage';

const viewportState = vi.hoisted(() => ({
  viewportMode: 'mobile' as
    | 'mobile'
    | 'tablet-portrait'
    | 'tablet-landscape'
    | 'desktop-or-other',
  isMobileViewport: true,
  isTabletViewport: false,
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => viewportState,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({ selectedDate: '2026-03-08', setSelectedDate: vi.fn() }),
}));

vi.mock('@/store/useExpenseStore', () => ({
  useExpenseStore: () => ({
    getExpensesByDate: () => [
      {
        id: 'e-1',
        amount: 10,
        date: '2026-03-08',
        description: 'Gasto base',
        category: 'operativo',
        paymentMethod: 'efectivo',
        createdAt: '2026-03-08T10:00:00.000Z',
      },
    ],
    loadExpensesByDate: vi.fn().mockResolvedValue(undefined),
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
}));

vi.mock('@/store/useTipStore', () => ({
  useTipStore: () => ({
    tipPayouts: [
      {
        id: 'tip-1',
        tipDate: '2026-03-08',
        paidAt: '2026-03-08T12:00:00.000Z',
        paymentMethod: 'pago_movil',
        amountBs: 15,
        originType: 'sale',
        originId: 'sale-1',
      },
    ],
    loadTipsByDateRange: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('./ExpensesPage/components/ExpensesContent', () => ({
  ExpensesContent: ({
    expenses,
  }: {
    expenses: Array<{ description: string; amount: number }>;
  }) => (
    <div>
      ExpensesContent
      <span data-testid="expenses-content-count">{expenses.length}</span>
      <span data-testid="expenses-content-total">
        {expenses.reduce((sum, expense) => sum + expense.amount, 0)}
      </span>
      <span data-testid="expenses-content-has-tip-payout">
        {expenses.some((expense) => expense.description === 'Pago de Propina')
          ? 'yes'
          : 'no'}
      </span>
    </div>
  ),
}));
vi.mock('./ExpensesPage/components/ExpensesTabletSidebar', () => ({
  ExpensesTabletSidebar: ({ dataTestId }: { dataTestId?: string }) => (
    <div data-testid={dataTestId ?? 'expenses-secondary-column'}>Sidebar</div>
  ),
}));
vi.mock('./ExpensesPage/components/ExpensesMobileHeaderControls', () => ({
  ExpensesMobileHeaderControls: () => <div>Controls</div>,
}));
vi.mock('./ExpensesPage/components/ExpensesDayTotalCard', () => ({
  ExpensesDayTotalCard: () => <div>TotalCard</div>,
}));
vi.mock('./ExpensesPage/components/ExpensesSheet', () => ({
  ExpensesSheet: () => (
    <div
      data-testid="expense-sheet-content"
      data-side="bottom"
      data-tablet-side="right"
    />
  ),
}));

describe('ExpensesPage responsive secondary flow', () => {
  it('renders tablet split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<ExpensesPage />);

    expect(screen.getByTestId('expenses-primary-column')).toBeInTheDocument();
    expect(screen.getByTestId('expenses-secondary-column')).toBeInTheDocument();
    expect(screen.getByTestId('expenses-controls-card')).toBeInTheDocument();
    const primaryColumn = screen.getByTestId('expenses-primary-column');
    const html = (primaryColumn as unknown as { innerHTML: string }).innerHTML;
    expect(html.indexOf('expenses-controls-card')).toBeLessThan(
      html.indexOf('ExpensesContent')
    );
    expect(screen.getByTestId('expense-sheet-content')).toHaveAttribute(
      'data-tablet-side',
      'right'
    );
    expect(screen.getByTestId('expenses-content-count')).toHaveTextContent('2');
    expect(screen.getByTestId('expenses-content-total')).toHaveTextContent(
      '25'
    );
    expect(
      screen.getByTestId('expenses-content-has-tip-payout')
    ).toHaveTextContent('yes');
  });

  it('keeps mobile stack without tablet split under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<ExpensesPage />);

    expect(
      screen.queryByTestId('expenses-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('expenses-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByTestId('expense-sheet-content')).toHaveAttribute(
      'data-side',
      'bottom'
    );
    expect(
      screen.getByTestId('expenses-content-has-tip-payout')
    ).toHaveTextContent('yes');
  });
});
