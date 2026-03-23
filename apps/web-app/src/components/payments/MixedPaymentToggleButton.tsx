import { WalletCards } from 'lucide-react';
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
    <button
      type="button"
      data-testid="mixed-payment-toggle"
      aria-label="Pago mixto"
      aria-pressed={isMixedPayment}
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-[24px] transition-all duration-300',
        'bg-card border shadow-sm active:scale-[0.98] focus:outline-none text-left',
        isMixedPayment
          ? 'border-indigo-500/30'
          : 'border-border hover:border-primary/50'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors',
            isMixedPayment
              ? 'bg-indigo-500/10 text-indigo-600'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <WalletCards className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[16px] font-bold text-foreground">
            Pago Mixto
          </span>
          <span className="text-[13px] font-medium text-muted-foreground truncate">
            {isMixedPayment ? 'Dividir cobro en dos métodos' : 'Activar cobro dividido'}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors',
          isMixedPayment
            ? 'bg-muted text-muted-foreground'
            : 'bg-indigo-500/10 text-indigo-600'
        )}
      >
        {isMixedPayment ? 'Quitar' : 'Activar'}
      </div>
    </button>
  );
}
