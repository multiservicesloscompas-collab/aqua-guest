import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useConfigStore } from '@/store/useConfigStore';
import { Product } from '@/types';
import { Plus, Minus, Droplet, X } from 'lucide-react';

import { toast } from 'sonner';

interface AddProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_DISPLAY_LITERS = 19;

function useProductDisplayPrice(
  products: Product[],
  getPriceForLiters: (liters: number) => number
): Map<string, number> {
  const priceMap = new Map<string, number>();

  products.forEach((product) => {
    if (product.requiresLiters) {
      priceMap.set(product.id, getPriceForLiters(DEFAULT_DISPLAY_LITERS));
    } else {
      priceMap.set(product.id, product.defaultPrice);
    }
  });

  return priceMap;
}

export function AddProductSheet({ open, onOpenChange }: AddProductSheetProps) {
  const { addToCart } = useWaterSalesStore();
  const { products, getPriceForLiters, config } = useConfigStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liters, setLiters] = useState(DEFAULT_DISPLAY_LITERS);
  const [unitPrice, setUnitPrice] = useState(0);

  const displayPrices = useProductDisplayPrice(products, getPriceForLiters);

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
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <DrawerContent
        className={cn(
          'h-[90vh] rounded-t-2xl px-4 pb-8 sm:flex sm:h-full sm:flex-col sm:rounded-none'
        )}
      >
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DrawerClose>
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-lg font-bold">
            Agregar Producto
          </DrawerTitle>
          <DrawerDescription>
            Selecciona un producto, ajusta cantidad o litros y agregalo al
            carrito.
          </DrawerDescription>
        </DrawerHeader>

        {!selectedProduct ? (
          /* Selector de producto */
          <div className="grid grid-cols-2 gap-3 sm:flex-1 sm:content-center">
            {products.map((product) => {
              const displayPrice =
                displayPrices.get(product.id) ?? product.defaultPrice;
              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  data-testid={`add-product-option-${product.id}`}
                  className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-xl border-2 border-transparent hover:border-primary/30 transition-all active:scale-95"
                >
                  <span className="text-3xl">{product.icon || '📦'}</span>
                  <span className="text-sm font-semibold text-foreground text-center">
                    {product.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Bs {displayPrice.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Formulario de producto */
          <div className="flex flex-col h-full space-y-5 overflow-y-auto pt-2 pb-6 px-1">
            {/* Producto seleccionado */}
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl shrink-0">
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
            <div className="mt-auto space-y-3 pt-4 border-t shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-extrabold text-foreground">
                  Bs {subtotal.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={handleAdd}
                disabled={unitPrice <= 0}
                data-testid="add-product-confirm"
                className="w-full h-14 text-base font-bold gradient-primary rounded-xl shadow-fab"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
