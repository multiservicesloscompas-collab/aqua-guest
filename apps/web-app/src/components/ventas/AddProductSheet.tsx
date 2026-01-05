import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { Product } from '@/types';
import { Plus, Minus, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductSheet({ open, onOpenChange }: AddProductSheetProps) {
  const { products, addToCart, getPriceForLiters, config } = useAppStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liters, setLiters] = useState(19);
  const [unitPrice, setUnitPrice] = useState(0);

  // Actualizar precio cuando cambian los litros para productos que lo requieren
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.requiresLiters) {
        const price = getPriceForLiters(liters);
        setUnitPrice(price);
      } else {
        setUnitPrice(selectedProduct.defaultPrice);
      }
    }
  }, [selectedProduct, liters, getPriceForLiters]);

  // Inicializar litros al seleccionar producto
  useEffect(() => {
    if (selectedProduct?.requiresLiters) {
      setLiters(19);
    }
  }, [selectedProduct]);

  const handleReset = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setLiters(19);
    setUnitPrice(0);
  };

  const handleAdd = () => {
    if (!selectedProduct) return;

    addToCart({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      liters: selectedProduct.requiresLiters ? liters : undefined,
      unitPrice,
    });

    toast.success(`${selectedProduct.name} agregado`);
    handleReset();
    onOpenChange(false);
  };

  const subtotal = quantity * unitPrice;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold">
            Agregar Producto
          </SheetTitle>
        </SheetHeader>

        {!selectedProduct ? (
          /* Selector de producto */
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-xl border-2 border-transparent hover:border-primary/30 transition-all active:scale-95"
              >
                <span className="text-3xl">{product.icon || '📦'}</span>
                <span className="text-sm font-semibold text-foreground text-center">
                  {product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Bs {product.defaultPrice.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Formulario de producto */
          <div className="flex flex-col h-full space-y-5">
            {/* Producto seleccionado */}
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <span className="text-4xl">{selectedProduct.icon || '📦'}</span>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {selectedProduct.name}
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs text-primary font-medium"
                >
                  Cambiar producto
                </button>
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Cantidad</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-4xl font-extrabold text-foreground w-20 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Litros (condicional) */}
            {selectedProduct.requiresLiters && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-primary" />
                  Litros
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={config.literPricing.length - 1}
                    step="1"
                    value={
                      config.literPricing
                        .map((lp) => lp.breakpoint)
                        .sort((a, b) => a - b)
                        .indexOf(liters) !== -1
                        ? config.literPricing
                            .map((lp) => lp.breakpoint)
                            .sort((a, b) => a - b)
                            .indexOf(liters)
                        : 0
                    }
                    onChange={(e) => {
                      const index = Number(e.target.value);
                      const breakpoints = config.literPricing
                        .map((lp) => lp.breakpoint)
                        .sort((a, b) => a - b);
                      setLiters(breakpoints[index]);
                    }}
                    className="flex-1 h-2 bg-muted rounded-full accent-primary"
                  />
                  <span className="text-lg font-bold text-primary w-12 text-center">
                    {liters}L
                  </span>
                </div>
              </div>
            )}

            {/* Precio unitario */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Precio por Unidad (Bs)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="h-12 text-lg font-semibold text-center"
              />
            </div>

            {/* Subtotal y botón */}
            <div className="mt-auto space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-extrabold text-foreground">
                  Bs {subtotal.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={handleAdd}
                disabled={unitPrice <= 0}
                className="w-full h-14 text-base font-bold gradient-primary rounded-xl shadow-fab"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
