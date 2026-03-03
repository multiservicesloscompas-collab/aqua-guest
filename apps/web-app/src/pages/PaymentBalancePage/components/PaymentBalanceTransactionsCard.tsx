import { Edit2, Loader2, Trash2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PaymentBalanceTransaction,
  PaymentMethodLabels,
  PaymentMethod,
} from '@/types';

interface PaymentBalanceTransactionsCardProps {
  transactions: PaymentBalanceTransaction[];
  isDeleting: boolean;
  deletingId: string | null;
  editingTransaction: string | null;
  onEdit: (transaction: PaymentBalanceTransaction) => void;
  onDelete: (id: string) => void;
  getMethodIcon: (method: PaymentMethod) => string;
}

export function PaymentBalanceTransactionsCard({
  transactions,
  isDeleting,
  deletingId,
  editingTransaction,
  onEdit,
  onDelete,
  getMethodIcon,
}: PaymentBalanceTransactionsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4">Transferencias del día</h3>

        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay transferencias para este día
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">
                      {getMethodIcon(transaction.fromMethod)}
                    </span>
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg">
                      {getMethodIcon(transaction.toMethod)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {PaymentMethodLabels[transaction.fromMethod]} →{' '}
                      {PaymentMethodLabels[transaction.toMethod]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.amountUsd
                        ? `$${transaction.amountUsd.toFixed(2)}`
                        : `Bs ${transaction.amount.toFixed(2)}`}
                    </p>
                    {transaction.notes && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                    disabled={editingTransaction !== null}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(transaction.id)}
                    disabled={editingTransaction !== null || isDeleting}
                  >
                    {isDeleting && deletingId === transaction.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
