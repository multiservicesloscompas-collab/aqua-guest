import { WalletCards } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { SaleMixedPaymentFields } from '@/components/ventas/SaleMixedPaymentFields';

interface MixedPaymentCardProps {
  isMixedPayment: boolean;
  onToggle: () => void;
  // SaleMixedPaymentFields props
  primaryMethod: PaymentMethod;
  secondaryMethod: PaymentMethod;
  amountInput: string;
  totalBs: number;
  variant?: 'grid' | 'select';
  amountInputMode?: 'primary' | 'secondary';
  onAmountInputChange: (value: string) => void;
  onSecondaryMethodChange: (value: PaymentMethod) => void;
}

export function MixedPaymentCard({
  isMixedPayment,
  onToggle,
  primaryMethod,
  secondaryMethod,
  amountInput,
  totalBs,
  variant = 'grid',
  amountInputMode = 'secondary',
  onAmountInputChange,
  onSecondaryMethodChange,
}: MixedPaymentCardProps) {
  const isDisabled = totalBs < 2;

  return (
    <div
      className={cn(
        'rounded-[24px] border transition-all duration-300 overflow-hidden',
        isMixedPayment
          ? 'bg-card border-indigo-500/30 shadow-md'
          : 'bg-card/50 border-border/40 shadow-sm active:scale-[0.98]',
        isDisabled && 'opacity-60 pointer-events-none'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none disabled:cursor-not-allowed"
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
              {isDisabled
                ? 'Monto insuficiente para dividir'
                : isMixedPayment
                ? 'Dividir cobro en dos métodos'
                : 'Activar cobro dividido'}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors',
            isMixedPayment
              ? 'bg-muted text-muted-foreground'
              : 'bg-indigo-500/10 text-indigo-600',
            isDisabled && 'bg-muted text-muted-foreground/50'
          )}
        >
          {isMixedPayment ? 'Quitar' : 'Activar'}
        </div>
      </button>

      {isMixedPayment && !isDisabled && (
        <div className="p-3 bg-muted/30 border-t border-border/40">
          <SaleMixedPaymentFields
            primaryMethod={primaryMethod}
            secondaryMethod={secondaryMethod}
            amountInput={amountInput}
            totalBs={totalBs}
            variant={variant}
            amountInputMode={amountInputMode}
            onAmountInputChange={onAmountInputChange}
            onSecondaryMethodChange={onSecondaryMethodChange}
            hideHeader
          />
        </div>
      )}
    </div>
  );
}
