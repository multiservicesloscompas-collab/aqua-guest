import { Card, CardContent } from '@/components/ui/card';

interface TransactionsSummaryTotalsProps {
  totalIncome: number;
  totalExpenses: number;
}

export function TransactionsSummaryTotals({
  totalIncome,
  totalExpenses,
}: TransactionsSummaryTotalsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <p className="text-xs text-green-600 font-medium uppercase">
            Ingresos
          </p>
          <p className="text-xl font-bold text-green-700">
            Bs {totalIncome.toLocaleString('es-VE')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <p className="text-xs text-red-600 font-medium uppercase">Egresos</p>
          <p className="text-xl font-bold text-red-700">
            Bs {totalExpenses.toLocaleString('es-VE')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
