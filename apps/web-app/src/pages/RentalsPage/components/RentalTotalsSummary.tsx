interface RentalTotalsSummaryProps {
  subtotalUsd: number;
  tipAmountBs: number;
  totalUsd: number;
}

export function RentalTotalsSummary({
  subtotalUsd,
  tipAmountBs,
  totalUsd,
}: RentalTotalsSummaryProps) {
  return (
    <div className="space-y-1 text-right">
      <p className="text-xs text-muted-foreground">
        Subtotal: ${subtotalUsd.toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground">
        Propina: Bs {tipAmountBs.toFixed(2)}
      </p>
      <p className="text-sm font-bold">Total final: ${totalUsd.toFixed(2)}</p>
    </div>
  );
}
