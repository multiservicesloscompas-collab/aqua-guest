import { Sale, PaymentMethodLabels } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface RecentSalesProps {
  sales: Sale[];
}

const paymentIcons = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
};

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 border shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Ventas Recientes
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Sin ventas hoy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Ventas Recientes
      </h3>
      <div className="space-y-2">
        {sales.slice(0, 5).map((sale) => {
          const PaymentIcon = paymentIcons[sale.paymentMethod];
          const time = new Date(sale.createdAt).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={sale.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <PaymentIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {sale.items.length} producto{sale.items.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {PaymentMethodLabels[sale.paymentMethod]} • {time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  Bs {sale.totalBs.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${sale.totalUsd.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
