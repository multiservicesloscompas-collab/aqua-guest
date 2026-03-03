import { DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RentalSheetFooterProps {
  totalUsdText: string;
  isSaving: boolean;
  onSubmit: () => void;
}

export function RentalSheetFooter({
  totalUsdText,
  isSaving,
  onSubmit,
}: RentalSheetFooterProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground">Total</span>
        <div className="flex items-center gap-1">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold">{totalUsdText}</span>
        </div>
      </div>
      <Button
        onClick={onSubmit}
        disabled={isSaving}
        className="w-full h-12 text-base font-semibold"
        style={{
          marginBottom: '4rem',
          marginTop: '2rem',
        }}
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isSaving ? 'Registrando...' : 'Confirmar Alquiler'}
      </Button>
    </div>
  );
}
