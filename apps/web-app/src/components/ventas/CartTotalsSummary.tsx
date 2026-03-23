interface CartTotalsSummaryProps {
  subtotalBs: number;
  tipAmountBs: number;
  totalBs: number;
  totalUsd: number;
}

export function CartTotalsSummary({
  subtotalBs,
  tipAmountBs,
  totalBs,
  totalUsd,
}: CartTotalsSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span>Bs {subtotalBs.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Propina</span>
        <span>Bs {tipAmountBs.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Total final
        </span>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-foreground">
            Bs {totalBs.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            ${totalUsd.toFixed(2)} USD
          </p>
        </div>
      </div>
    </div>
  );
}
