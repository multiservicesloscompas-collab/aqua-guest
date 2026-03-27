import { Wallet } from 'lucide-react';

interface ExpensesDayTotalCardProps {
  totalExpenses: number;
}

export function ExpensesDayTotalCard({
  totalExpenses,
}: ExpensesDayTotalCardProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-destructive" />
          <span className="text-sm font-medium text-foreground">
            Total Egresos
          </span>
        </div>
        <span className="text-xl font-extrabold text-destructive">
          Bs {totalExpenses.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
