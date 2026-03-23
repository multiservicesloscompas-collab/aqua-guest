import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/types';

interface CartItemsListProps {
  items: CartItem[];
  onRemove: (id: string) => void;
}

export function CartItemsList({ items, onRemove }: CartItemsListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {item.productName}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.quantity} x Bs {item.unitPrice.toFixed(2)}
              {item.liters && ` • ${item.liters}L`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              Bs {item.subtotal.toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
