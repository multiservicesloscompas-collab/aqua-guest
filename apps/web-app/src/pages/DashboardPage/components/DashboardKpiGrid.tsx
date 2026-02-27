import { KpiCard } from '@/components/ui/KpiCard';
import {
  ArrowLeftRight,
  DollarSign,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AppRoute } from '@/types';

interface DashboardKpiGridProps {
  currency: 'Bs' | 'USD';
  onNavigate?: (route: AppRoute) => void;
  onToggleCurrency: () => void;
  values: {
    mtdIncomeText: string;
    mtdNetText: string;
    mtdNetSubtitle: string;
    mtdNetVariant: 'default' | 'warning';
    dayExpenseText: string;
    dayNetText: string;
    dayNetSubtitle: string;
    dayNetVariant: 'success' | 'warning';
    dayTransactions: number;
  };
}

export function DashboardKpiGrid({
  currency,
  onNavigate,
  onToggleCurrency,
  values,
}: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard
        title="Acumulado Mes"
        value={values.mtdIncomeText}
        subtitle="Ingresos"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        variant="default"
      />
      <KpiCard
        title="Neto Mes"
        value={values.mtdNetText}
        subtitle={values.mtdNetSubtitle}
        icon={<DollarSign className="w-4 h-4 text-primary" />}
        variant={values.mtdNetVariant}
      />
      <KpiCard
        title="Egresos Hoy"
        value={values.dayExpenseText}
        subtitle="Hoy"
        icon={<Wallet className="w-4 h-4 text-destructive" />}
        variant="danger"
        onClick={() => onNavigate?.('egresos')}
      />
      <KpiCard
        title="Neto Hoy"
        value={values.dayNetText}
        subtitle={values.dayNetSubtitle}
        variant={values.dayNetVariant}
      />
      <KpiCard
        title="Transacciones"
        value={values.dayTransactions}
        subtitle="hoy"
        variant="success"
        icon={<Receipt className="w-4 h-4 text-primary" />}
        onClick={() => onNavigate?.('transacciones-hoy')}
        className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all"
      />
      <KpiCard
        title="Moneda"
        value={currency}
        subtitle="Cambiar"
        icon={<ArrowLeftRight className="w-4 h-4 text-blue-500" />}
        variant="info"
        onClick={onToggleCurrency}
        className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all"
      />
    </div>
  );
}
