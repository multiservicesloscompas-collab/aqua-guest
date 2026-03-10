import { useState, useEffect } from 'react';
import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletControlsCard } from '@/components/layout/TabletControlsCard';
import { DateSelector } from '@/components/ventas/DateSelector';
import { PaymentFilter } from '@/components/ventas/PaymentFilter';
import { SalesList } from '@/components/ventas/SalesList';
import { AddProductSheet } from '@/components/ventas/AddProductSheet';
import { CartSheet } from '@/components/ventas/CartSheet';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { useAppStore } from '@/store/useAppStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { TABLET_PRIMARY_COLUMN_CLASS } from '@/lib/responsive/tabletLayoutPatterns';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';

interface WaterSalesPageProps {
  autoOpenAdd?: boolean;
}

export function WaterSalesPage({ autoOpenAdd }: WaterSalesPageProps = {}) {
  const { isTabletViewport } = useViewportMode();
  const { selectedDate, setSelectedDate } = useAppStore();
  const { getSalesByDate, cart, loadSalesByDate } = useWaterSalesStore();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'todos'>(
    'todos'
  );
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    if (autoOpenAdd) setShowAddProduct(true);
  }, [autoOpenAdd]);

  useEffect(() => {
    if (!selectedDate) return;

    const cachedSales = getSalesByDate(selectedDate);

    if (cachedSales.length > 0) {
      return void 0;
    }

    setLoadingSales(true);
    loadSalesByDate(selectedDate)
      .catch((err) => {
        console.error('Error loading sales for date:', selectedDate, err);
      })
      .finally(() => {
        setLoadingSales(false);
      });
  }, [selectedDate, loadSalesByDate, getSalesByDate]);

  const sales = getSalesByDate(selectedDate);
  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <AppPageContainer>
        {isTabletViewport ? (
          <div
            className={TABLET_PRIMARY_COLUMN_CLASS}
            data-testid="water-sales-primary-column"
            data-audit-structure="tablet-controls-cart-records"
          >
            <section
              data-testid="water-sales-tablet-controls"
              data-audit-order="1"
              aria-label="Controles de venta"
            >
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                loading={loadingSales}
              />

              <TabletControlsCard
                title="Filtros"
                data-testid="water-sales-filter-card"
              >
                <PaymentFilter
                  selectedFilter={paymentFilter}
                  onFilterChange={setPaymentFilter}
                />
              </TabletControlsCard>
            </section>

            <section
              data-testid="water-sales-cart-region"
              data-audit-order="2"
              aria-label="Resumen del carrito"
            >
              <button
                onClick={() => setShowCart(true)}
                disabled={cartCount === 0}
                data-testid="water-sales-cart-button-tablet"
                className={cn(
                  'group relative w-full rounded-2xl overflow-hidden',
                  'transition-all duration-300',
                  cartCount === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-fab'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 gradient-primary transition-opacity duration-300',
                    cartCount === 0
                      ? 'opacity-70'
                      : 'opacity-100 group-hover:opacity-90'
                  )}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-2xl" />

                <div className="relative z-10 flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                      <ShoppingCart className="w-5 h-5 text-white" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[10px] font-bold shadow-sm">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white/70 text-[11px] font-medium uppercase tracking-wide leading-none mb-0.5">
                        {cartCount === 0
                          ? 'Carrito vacío'
                          : `${cartCount} ${
                              cartCount === 1 ? 'producto' : 'productos'
                            }`}
                      </span>
                      <span className="text-white font-bold text-base leading-none">
                        Ver carrito
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-white/70 text-[11px] font-medium uppercase tracking-wide leading-none mb-0.5">
                      Total
                    </span>
                    <span className="text-white font-bold text-base leading-none">
                      Bs {cartTotal.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-black/10 rounded-b-2xl" />
              </button>
            </section>

            <section
              data-testid="water-sales-records-region"
              data-audit-order="3"
              aria-label="Registros de ventas"
            >
              {loadingSales && sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 mb-3 animate-spin" />
                  <p className="text-sm font-medium">Cargando ventas...</p>
                </div>
              ) : (
                <SalesList sales={sales} paymentFilter={paymentFilter} />
              )}
            </section>
          </div>
        ) : (
          <>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              loading={loadingSales}
            />

            {cartCount > 0 && (
              <Button
                onClick={() => setShowCart(true)}
                className={cn(
                  'fixed bottom-24 left-4 h-14 px-6 rounded-full bg-foreground text-background shadow-fab z-40',
                  'transition-all hover:scale-105 active:scale-95 animate-scale-in'
                )}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                <span className="font-bold">{cartCount}</span>
                <span className="ml-2 text-sm opacity-80">
                  Bs {cartTotal.toFixed(0)}
                </span>
              </Button>
            )}

            <PaymentFilter
              selectedFilter={paymentFilter}
              onFilterChange={setPaymentFilter}
            />

            {loadingSales && sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mb-3 animate-spin" />
                <p className="text-sm font-medium">Cargando ventas...</p>
              </div>
            ) : (
              <SalesList sales={sales} paymentFilter={paymentFilter} />
            )}
          </>
        )}
      </AppPageContainer>

      {/* FAB para agregar producto */}
      <Button
        onClick={() => setShowAddProduct(true)}
        className={cn(
          'fixed bottom-24 right-4 w-14 h-14 rounded-full gradient-primary shadow-fab z-40',
          'transition-transform hover:scale-105 active:scale-95'
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <AddProductSheet open={showAddProduct} onOpenChange={setShowAddProduct} />
      <CartSheet open={showCart} onOpenChange={setShowCart} />
    </div>
  );
}
