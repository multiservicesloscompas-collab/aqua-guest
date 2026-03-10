import { Loader2, Wallet } from 'lucide-react';

import { ExpenseCard } from '@/components/egresos/ExpenseCard';
import { WeeklyExpensesView } from '@/components/egresos/WeeklyExpensesView';
import { Expense } from '@/types';

type ExpensesViewMode = 'day' | 'week';

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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 mb-3 animate-spin" />
        <p className="text-sm font-medium">Cargando egresos...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Wallet className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Sin egresos este día</p>
        <p className="text-xs">Presiona + para registrar un gasto</p>
      </div>
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
