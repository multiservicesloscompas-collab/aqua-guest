import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Expense,
  ExpenseCategoryLabels,
  PaymentMethodLabels,
} from '@/types';
import { Trash2, Pencil, Loader2 } from 'lucide-react';

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
  return (
    <div className="bg-card rounded-xl p-4 border shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            {expense.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {ExpenseCategoryLabels[expense.category]}
            </p>
            <span className="text-xs text-muted-foreground">•</span>
            <p className="text-xs text-muted-foreground">
              {PaymentMethodLabels[expense.paymentMethod || 'efectivo']}
            </p>
          </div>
          {expense.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              {expense.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-destructive">
            Bs {expense.amount.toFixed(2)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(expense)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar egreso?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(expense.id)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && deletingId === expense.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Eliminar'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
