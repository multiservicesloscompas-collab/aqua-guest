import { CircleDollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PaymentFilter = 'paid' | 'unpaid';

interface FollowUpFiltersCardProps {
  paymentFilter: PaymentFilter | 'all';
  onPaymentFilterChange: (filter: PaymentFilter | 'all') => void;
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleDollarSign className="h-4 w-4" />
            Estado de pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unpaid">No pagadas</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
