import { DollarSign } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';

interface RentalSheetFooterProps {
  subtotalUsdText: string;
  tipAmountBs: number;
  totalUsdText: string;
  isSaving: boolean;
  onSubmit: () => void;
}

export function RentalSheetFooter({
  subtotalUsdText,
  tipAmountBs,
  totalUsdText,
  isSaving,
  onSubmit,
}: RentalSheetFooterProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Subtotal: ${subtotalUsdText}
          </p>
          <p className="text-xs text-muted-foreground">
            Propina: Bs {tipAmountBs.toFixed(2)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Total final
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold">{totalUsdText}</span>
        </div>
      </div>
      <LoadingButton
        onClick={onSubmit}
        loading={isSaving}
        loadingText="Registrando..."
        data-testid="rental-confirm-button"
        className="w-full h-12 text-base font-semibold"
        style={{
          marginBottom: '4rem',
          marginTop: '2rem',
        }}
      >
        Confirmar Alquiler
      </LoadingButton>
    </div>
  );
}
