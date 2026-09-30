import type { MouseEvent } from 'react';
import {
  CheckCircle2,
  Circle,
  DollarSign,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RentalCardFooterProps {
  rentalId: string;
  isPaid: boolean;
  totalUsd: number;
  canExtend: boolean;
  onPaymentClick: (event: MouseEvent) => void;
  onExtendClick: (event: MouseEvent) => void;
  onEditClick: (event: MouseEvent) => void;
  onDeleteClick: (event: MouseEvent) => void;
}

export function RentalCardFooter({
  rentalId,
  isPaid,
  totalUsd,
  canExtend,
  onPaymentClick,
  onExtendClick,
  onEditClick,
  onDeleteClick,
}: RentalCardFooterProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onPaymentClick}
          data-testid={`rental-payment-pill-${rentalId}`}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium transition-colors',
            isPaid
              ? 'bg-green-500/10 text-green-600'
              : 'bg-red-500/10 text-red-600'
          )}
        >
          {isPaid ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          {isPaid ? 'Pagado' : 'Pendiente'}
        </button>

        <div className="flex items-center gap-1 font-bold">
          <DollarSign className="w-4 h-4 text-primary" />
          {totalUsd.toFixed(2)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {canExtend && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onExtendClick}
            data-testid={`rental-extend-${rentalId}`}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Extender tiempo"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={onEditClick}
          data-testid={`rental-edit-${rentalId}`}
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDeleteClick}
          data-testid={`rental-delete-${rentalId}`}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
