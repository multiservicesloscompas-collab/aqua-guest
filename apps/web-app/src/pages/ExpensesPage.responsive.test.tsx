import type { ReactNode } from 'react';
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
    getExpensesByDate: () => [{ id: 'e-1', amount: 10 }],
    loadExpensesByDate: vi.fn().mockResolvedValue(undefined),
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('./ExpensesPage/components/ExpensesContent', () => ({
  ExpensesContent: () => <div>ExpensesContent</div>,
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
vi.mock('./ExpensesPage/components/ExpenseSheetForm', () => ({
  ExpenseSheetForm: () => <div>Form</div>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({
    side,
    tabletSide,
    tabletClassName,
    className,
    children,
  }: {
    side?: string;
    tabletSide?: string;
    tabletClassName?: string;
    className?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="expense-sheet-content"
      data-side={side}
      data-tablet-side={tabletSide}
      data-tablet-class={tabletClassName}
      className={className}
    >
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
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
  });
});
