interface RentalsSummaryCardsProps {
  activeCount: number;
  totalText: string;
  paidText: string;
}

export function RentalsSummaryCards({
  activeCount,
  totalText,
  paidText,
}: RentalsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-card rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-primary">{activeCount}</p>
        <p className="text-xs text-muted-foreground">Activos</p>
      </div>
      <div className="bg-card rounded-xl p-3 text-center">
        <p className="text-2xl font-bold">{totalText}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className="bg-card rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-green-600">{paidText}</p>
        <p className="text-xs text-muted-foreground">Cobrado</p>
      </div>
    </div>
  );
}
