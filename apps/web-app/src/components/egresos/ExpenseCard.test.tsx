import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@/types';

import { ExpenseCard } from './ExpenseCard';

const baseExpense: Expense = {
  id: 'expense-1',
  date: '2026-03-08',
  description: 'Gasto operativo',
  amount: 10,
  category: 'operativo',
  paymentMethod: 'efectivo',
  createdAt: '2026-03-08T10:00:00.000Z',
};

describe('ExpenseCard', () => {
  it('hides edit/delete actions for derived tip payout expenses', () => {
    render(
      <ExpenseCard
        expense={{
          ...baseExpense,
          id: 'tip-payout:tip-1',
          description: 'Pago de Propina',
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isDeleting={false}
        deletingId={null}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps edit/delete actions for manual expenses', () => {
    render(
      <ExpenseCard
        expense={baseExpense}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isDeleting={false}
        deletingId={null}
      />
    );

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
