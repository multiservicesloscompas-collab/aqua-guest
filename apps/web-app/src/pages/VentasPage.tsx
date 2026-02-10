import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
import { PaymentFilter } from '@/components/ventas/PaymentFilter';
import { SalesList } from '@/components/ventas/SalesList';
import { AddProductSheet } from '@/components/ventas/AddProductSheet';
import { CartSheet } from '@/components/ventas/CartSheet';
import { useAppStore } from '@/store/useAppStore';
import { getVenezuelaDate } from '@/services/DateService';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';

export function VentasPage() {
  const {
    selectedDate,
    setSelectedDate,
    getSalesByDate,
    cart,
    loadSalesByDate,
  } = useAppStore();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'todos'>(
    'todos'
  );
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    setSelectedDate(getVenezuelaDate());
  }, [setSelectedDate]);

  // Cargar ventas cuando cambia la fecha - Optimización de rendimiento
  useEffect(() => {
    if (!selectedDate) return;

    // Verificar si ya hay ventas en caché para esta fecha
    const cachedSales = getSalesByDate(selectedDate);

    if (cachedSales.length > 0) {
      // Ya tenemos datos, no es necesario cargar
      return;
    }

    // Cargar ventas de la fecha específica
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

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Venta de Agua" subtitle="Gestión de registros" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={loadingSales}
        />

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
      </main>

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

      {/* Botón del carrito */}
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
            Bs {cart.reduce((s, i) => s + i.subtotal, 0).toFixed(0)}
          </span>
        </Button>
      )}

      <AddProductSheet open={showAddProduct} onOpenChange={setShowAddProduct} />
      <CartSheet open={showCart} onOpenChange={setShowCart} />
    </div>
  );
}
