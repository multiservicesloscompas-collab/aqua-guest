import { WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MixedPaymentToggleButtonProps {
  isMixedPayment: boolean;
  onToggle: () => void;
}

export function MixedPaymentToggleButton({
  isMixedPayment,
  onToggle,
}: MixedPaymentToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      data-testid="mixed-payment-toggle"
      aria-label="Pago mixto"
      aria-pressed={isMixedPayment}
      onClick={onToggle}
      className={cn(
        'w-full min-h-16 justify-between rounded-xl border px-4 py-3 text-left shadow-sm touch-manipulation',
        isMixedPayment
          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
          : 'text-foreground hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      <span className="inline-flex items-start gap-3">
        <WalletCards className="mt-0.5 h-5 w-5 shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">
            {isMixedPayment ? 'Pago mixto activado' : 'Activar pago mixto'}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Divide el cobro entre dos métodos
          </span>
        </span>
      </span>
      <span className="text-xs font-semibold shrink-0">
        {isMixedPayment ? 'Activo' : 'Activar'}
      </span>
    </Button>
  );
}
