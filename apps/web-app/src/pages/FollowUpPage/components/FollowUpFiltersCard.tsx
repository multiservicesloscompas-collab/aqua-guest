import { CircleDollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FollowUpFilter = 'in-progress' | 'unpaid';

interface FollowUpFiltersCardProps {
  paymentFilter: FollowUpFilter | 'all';
  onPaymentFilterChange: (filter: FollowUpFilter | 'all') => void;
  isTabletViewport: boolean;
}

export function FollowUpFiltersCard({
  paymentFilter,
  onPaymentFilterChange,
  isTabletViewport,
}: FollowUpFiltersCardProps) {
  const wrapperClass = isTabletViewport ? 'grid grid-cols-1' : 'space-y-3';

  return (
    <div className={wrapperClass}>
      <Card className="border-border/40 shadow-sm overflow-hidden rounded-[24px]">
        <CardHeader className="pb-3 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-foreground/80">
            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <CircleDollarSign className="h-4 w-4" />
            </div>
            Estado de pago
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-5 px-5 bg-muted/5">
          <div className="flex bg-muted/40 p-1.5 rounded-2xl">
            <button
              onClick={() => onPaymentFilterChange('all')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                paymentFilter === 'all'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onPaymentFilterChange('in-progress')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                paymentFilter === 'in-progress'
                  ? 'bg-background shadow-sm text-rose-600'
                  : 'text-muted-foreground hover:text-rose-600 hover:bg-background/50'
              }`}
            >
              En proceso
            </button>
            <button
              onClick={() => onPaymentFilterChange('unpaid')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                paymentFilter === 'unpaid'
                  ? 'bg-background shadow-sm text-emerald-600'
                  : 'text-muted-foreground hover:text-emerald-600 hover:bg-background/50'
              }`}
            >
              Por pagar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
