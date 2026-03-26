import { Banknote, type LucideIcon } from 'lucide-react';

import type { PaymentDisplayModel } from '@/services/payments/paymentDisplayModel';
import type { Sale } from '@/types';
import { PaymentMethodLabels } from '@/types';
import { deriveSaleTipAmountBs } from '@/services/transactions/transactionTotals';

interface SalePaymentBreakdownProps {
  sale: Sale;
  paymentDisplay: PaymentDisplayModel;
  timeLabel: string;
  paymentIcon: LucideIcon;
}

export function SalePaymentBreakdown({
  sale,
  paymentDisplay,
  timeLabel,
  paymentIcon: PaymentIcon,
}: SalePaymentBreakdownProps) {
  const subtotalBs = (sale.items || []).reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );
  const tipAmountBs = deriveSaleTipAmountBs(sale.totalBs, subtotalBs);
  const inferredTipMethod =
    paymentDisplay.kind === 'mixed'
      ? paymentDisplay.lines.find((line) => line.method !== sale.paymentMethod)
          ?.label ?? PaymentMethodLabels[sale.paymentMethod]
      : PaymentMethodLabels[sale.paymentMethod];

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <PaymentIcon className="w-4 h-4 text-primary" />
        <p
          className="text-sm font-bold text-foreground"
          data-testid={`sale-price-${sale.id}`}
        >
          Bs {Number(sale.totalBs || 0).toFixed(2)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {paymentDisplay.label} • ${Number(sale.totalUsd || 0).toFixed(2)} •{' '}
        {timeLabel}
      </p>
      {tipAmountBs > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p data-testid={`sale-tip-descriptor-${sale.id}`}>
            Subtotal Bs {subtotalBs.toFixed(2)} + Propina Bs{' '}
            {tipAmountBs.toFixed(2)}
          </p>
          <p data-testid={`sale-method-descriptor-${sale.id}`}>
            Método principal: {PaymentMethodLabels[sale.paymentMethod]} ·
            Captura propina: {inferredTipMethod}
          </p>
        </div>
      )}

      {paymentDisplay.kind === 'mixed' && (
        <div
          className="mt-2 space-y-1"
          data-testid={`sale-mixed-breakdown-${sale.id}`}
        >
          {paymentDisplay.lines.map((line) => {
            return (
              <p
                key={`${sale.id}-${line.method}`}
                className="text-[11px] text-muted-foreground flex items-center gap-1.5"
              >
                <Banknote className="w-3 h-3" />
                <span>
                  {line.label}: Bs {line.amountBs.toFixed(2)} • $
                  {line.amountUsd.toFixed(2)}
                </span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
