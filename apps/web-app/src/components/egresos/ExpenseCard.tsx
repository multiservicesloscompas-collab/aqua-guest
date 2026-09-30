import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Expense, ExpenseCategoryLabels, PaymentMethodLabels } from '@/types';
import { Trash2, Pencil, Banknote } from 'lucide-react';
import { isTipPayoutDerivedExpenseId } from '@/services/expenses/expensesWithTipPayouts';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
}

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: ExpenseCardProps) {
  const isReadOnlyTipPayout = isTipPayoutDerivedExpenseId(expense.id);
  const isMixed = hasValidMixedPaymentSplits(expense.paymentSplits);
  const normalizedDescription = expense.description
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <div className="bg-card rounded-xl p-4 border shadow-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold text-foreground truncate"
            data-testid={`expense-description-${expense.id}`}
          >
            {expense.description}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {ExpenseCategoryLabels[expense.category]}
            </p>
            <span className="text-xs text-muted-foreground">•</span>
            {isMixed ? (
              <p className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                Pago mixto
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {PaymentMethodLabels[expense.paymentMethod || 'efectivo']}
              </p>
            )}
          </div>
          {expense.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">
              {expense.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="text-base font-bold text-destructive"
            data-testid={`expense-amount-${expense.id}`}
          >
            Bs {expense.amount.toFixed(2)}
          </span>
          {isReadOnlyTipPayout ? null : (
            <div className="flex items-center gap-1 mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(expense)}
                data-testid={`expense-card-edit-${expense.id}`}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <ConfirmDeleteDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`expense-card-delete-${expense.id}`}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                }
                title="¿Eliminar egreso?"
                description="Esta acción no se puede deshacer."
                onConfirm={() => onDelete(expense.id)}
                isDeleting={isDeleting}
                showSpinner={isDeleting && deletingId === expense.id}
                contentClassName="max-w-[90vw] rounded-xl"
              />
            </div>
          )}
        </div>
      </div>

      {isMixed && expense.paymentSplits && (
        <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 border border-border/40">
          {expense.paymentSplits
            .filter((split) => split.amountBs > 0)
            .sort((a, b) => b.amountBs - a.amountBs)
            .map((split) => (
              <div
                key={`${expense.id}-${split.method}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Banknote className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {PaymentMethodLabels[split.method]}
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground/80">
                  Bs {split.amountBs.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      )}

      <span
        className="sr-only"
        data-testid={`expense-kind-${normalizedDescription}-${expense.id}`}
      >
        {expense.description}
      </span>
    </div>
  );
}
