import { Card, CardContent } from '@/components/ui/card';

interface DeliveryStats {
  total: number;
  totalRevenue: number;
  unpaid: number;
  unpaidAmount: number;
}

interface DeliveryStatsGridProps {
  stats: DeliveryStats;
}

export function DeliveryStatsGrid({ stats }: DeliveryStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total entregas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Ingresos</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
          <p className="text-sm text-muted-foreground">Entregas no pagadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            ${stats.unpaidAmount.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Monto no pagado</p>
        </CardContent>
      </Card>
    </div>
  );
}
