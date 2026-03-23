import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CartItem } from '@/types';

export interface EditableCartItem extends Omit<CartItem, 'quantity'> {
  quantity: number | '';
}

interface EditSaleItemsEditorProps {
  items: EditableCartItem[];
  onQuantityChange: (itemId: string, quantity: string) => void;
}

export function EditSaleItemsEditor({
  items,
  onQuantityChange,
}: EditSaleItemsEditorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Items</Label>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{item.productName}</div>
              {item.liters && (
                <div className="text-xs text-muted-foreground">
                  {item.liters}L
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Cant.</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onQuantityChange(item.id, e.target.value)}
                className="w-16 h-8 text-center"
              />
            </div>

            <div className="w-20 text-right font-medium text-sm">
              Bs {item.subtotal.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
