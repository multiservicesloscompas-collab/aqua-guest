import { CheckCircle2, Clock3, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { formatBolivars, formatTipsDateLabel } from '../utils';

interface TipDaySummaryCardProps {
  selectedDate: string;
  totalTipsBs: number;
  totalTipsCount: number;
  pendingTipsCount: number;
  paidTipsCount: number;
  hasPendingTips: boolean;
  payingAll: boolean;
  onPayAllTips: () => void;
}

export function TipDaySummaryCard({
  selectedDate,
  totalTipsBs,
  totalTipsCount,
  pendingTipsCount,
  paidTipsCount,
  hasPendingTips,
  payingAll,
  onPayAllTips,
}: TipDaySummaryCardProps) {
  return (
    <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background px-4 py-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Resumen del dia
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground text-pretty">
            {formatTipsDateLabel(selectedDate)}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
            Bs {formatBolivars(totalTipsBs)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Registros
          </p>
          <p className="text-lg font-semibold text-foreground [font-variant-numeric:tabular-nums]">
            {totalTipsCount}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-amber-700">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Pendientes
          </p>
          <p className="mt-1 text-base font-semibold text-amber-700 [font-variant-numeric:tabular-nums]">
            {pendingTipsCount}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-300/40 bg-emerald-50/60 px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Pagadas
          </p>
          <p className="mt-1 text-base font-semibold text-emerald-700 [font-variant-numeric:tabular-nums]">
            {paidTipsCount}
          </p>
        </div>
      </div>

      <Button
        className="mt-4 h-11 w-full touch-manipulation"
        onClick={onPayAllTips}
        disabled={!hasPendingTips || payingAll}
      >
        <WalletCards className="h-4 w-4" aria-hidden="true" />
        {payingAll ? 'Pagando propinas…' : 'Pagar Todas del Dia'}
      </Button>
    </section>
  );
}
