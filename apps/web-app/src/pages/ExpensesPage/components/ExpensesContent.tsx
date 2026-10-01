import { Wallet } from 'lucide-react';

import { ExpenseCard } from '@/components/egresos/ExpenseCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { WeeklyExpensesView } from '@/components/egresos/WeeklyExpensesView';
import { Expense } from '@/types';
import type { ExpensesViewMode } from '../types';

interface ExpensesContentProps {
  viewMode: ExpensesViewMode;
  selectedDate: string;
  expenses: Expense[];
  loadingExpenses: boolean;
  isDeleting: boolean;
  deletingId: string | null;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpensesContent({
  viewMode,
  selectedDate,
  expenses,
  loadingExpenses,
  isDeleting,
  deletingId,
  onEdit,
  onDelete,
}: ExpensesContentProps) {
  if (viewMode === 'week') {
    return (
      <WeeklyExpensesView
        anchorDate={selectedDate}
        onEdit={onEdit}
        onDelete={onDelete}
        isDeleting={isDeleting}
        deletingId={deletingId}
      />
    );
  }

  if (loadingExpenses && expenses.length === 0) {
    return <LoadingState message="Cargando egresos..." />;
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sin egresos este día"
        hint="Presiona + para registrar un gasto"
      />
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
}
