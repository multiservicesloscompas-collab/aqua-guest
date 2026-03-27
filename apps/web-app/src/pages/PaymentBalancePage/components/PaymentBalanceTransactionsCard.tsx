import { Edit2, Loader2, Trash2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PaymentBalanceTransaction,
  PaymentMethodLabels,
  PaymentMethod,
} from '@/types';

const formatCurrency = (value: number, currency: 'USD' | 'Bs') =>
  currency === 'USD' ? `$${value.toFixed(2)}` : `Bs ${value.toFixed(2)}`;

const getDisplayAmounts = (transaction: PaymentBalanceTransaction) => {
  const outValue =
    transaction.fromMethod === 'divisa'
      ? transaction.amountOutUsd ?? transaction.amountUsd ?? 0
      : transaction.amountOutBs ?? transaction.amountBs ?? transaction.amount;

  const inValue =
    transaction.toMethod === 'divisa'
      ? transaction.amountInUsd ?? transaction.amountUsd ?? 0
      : transaction.amountInBs ?? transaction.amountBs ?? transaction.amount;

  const outCurrency: 'USD' | 'Bs' =
    transaction.fromMethod === 'divisa' ? 'USD' : 'Bs';
  const inCurrency: 'USD' | 'Bs' =
    transaction.toMethod === 'divisa' ? 'USD' : 'Bs';

  const differenceBs =
    transaction.differenceBs ??
    (transaction.amountInBs ?? transaction.amountBs ?? transaction.amount) -
      (transaction.amountOutBs ?? transaction.amountBs ?? transaction.amount);

  const differenceUsd =
    transaction.differenceUsd ??
    (transaction.amountInUsd !== undefined &&
    transaction.amountOutUsd !== undefined
      ? transaction.amountInUsd - transaction.amountOutUsd
      : undefined);

  return {
    outText: formatCurrency(outValue, outCurrency),
    inText: formatCurrency(inValue, inCurrency),
    differenceBs,
    differenceUsd,
  };
};

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
                {(() => {
                  const operationType =
                    transaction.operationType ?? 'equilibrio';
                  const display = getDisplayAmounts(transaction);
                  const differenceLabel =
                    display.differenceUsd !== undefined
                      ? `${
                          display.differenceUsd >= 0 ? '+' : ''
                        }$${display.differenceUsd.toFixed(2)}`
                      : `${
                          display.differenceBs >= 0 ? '+' : ''
                        }Bs ${display.differenceBs.toFixed(2)}`;

                  return (
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
                          {operationType === 'avance' ? 'Avance' : 'Equilibrio'}{' '}
                          · Salida {display.outText} · Entrada {display.inText}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Diferencia: {differenceLabel}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
