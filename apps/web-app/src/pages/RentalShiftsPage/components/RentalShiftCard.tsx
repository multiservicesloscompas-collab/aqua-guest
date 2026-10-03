import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ShiftListItem } from '../hooks/useRentalShiftsViewModel';

interface RentalShiftCardProps {
  item: ShiftListItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function RentalShiftCard({
  item,
  canEdit,
  onEdit,
  onDelete,
}: RentalShiftCardProps) {
  return (
    <Card className="overflow-hidden" data-testid={`shift-card-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-semibold truncate"
                  data-testid={`shift-label-${item.id}`}
                >
                  {item.label}
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground font-mono"
                  data-testid={`shift-code-${item.id}`}
                >
                  {item.code}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                <span data-testid={`shift-duration-${item.id}`}>
                  {item.durationText}
                </span>
                <span data-testid={`shift-price-${item.id}`}>
                  {item.priceText}
                </span>
              </div>
              {item.discountText && (
                <p
                  className="text-xs text-emerald-600 dark:text-emerald-400 mt-1"
                  data-testid={`shift-discount-${item.id}`}
                >
                  {item.discountText}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              disabled={!canEdit}
              aria-label={`Editar ${item.label}`}
              data-testid={`shift-edit-${item.id}`}
              className="h-9 w-9"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!canEdit || !item.canDelete}
              aria-label={`Eliminar ${item.label}`}
              data-testid={`shift-delete-${item.id}`}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
