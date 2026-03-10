import { useState } from 'react';
import { Sale, PaymentMethod, PaymentMethodLabels } from '@/types';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import {
  Trash2,
  Smartphone,
  Banknote,
  CreditCard,
  FileText,
  Pencil,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { EditSaleSheet } from './EditSaleSheet';
import { toast } from 'sonner';
import { getSafeTimestampForSorting } from '@/lib/date-utils';
import { buildSalePaymentDisplayModel } from '@/services/payments/paymentDisplayModel';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';
import { SalePaymentBreakdown } from './SalePaymentBreakdown';

interface SalesListProps {
  sales: Sale[];
  paymentFilter?: PaymentMethod | 'todos';
}

const paymentIcons: Record<PaymentMethod, any> = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
  divisa: DollarSign,
};

export function SalesList({ sales, paymentFilter = 'todos' }: SalesListProps) {
  const { deleteSale } = useWaterSalesStore();
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Filtrar ventas por método de pago si es necesario
  const filteredSales =
    paymentFilter === 'todos'
      ? sales
      : sales.filter((sale) => {
          if (!hasValidMixedPaymentSplits(sale.paymentSplits)) {
            return sale.paymentMethod === paymentFilter;
          }

          return sale.paymentSplits.some(
            (split) => split.method === paymentFilter
          );
        });

  const handleDelete = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete);
      toast.success('Venta eliminada');
      setSaleToDelete(null);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditSheetOpen(true);
  };

  if (filteredSales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">
          {paymentFilter === 'todos'
            ? 'Sin ventas este día'
            : `Sin ventas con ${
                PaymentMethodLabels[paymentFilter as PaymentMethod]
              }`}
        </p>
        <p className="text-xs">Presiona + para agregar una venta</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Ventas del Día ({filteredSales.length})
            {paymentFilter !== 'todos' && (
              <span className="text-xs text-muted-foreground ml-2">
                ({PaymentMethodLabels[paymentFilter as PaymentMethod]})
              </span>
            )}
          </h3>
          <span
            className="text-sm font-bold text-primary"
            data-testid="total-sales"
          >
            Bs{' '}
            {filteredSales
              .reduce((sum, s) => {
                const num = Number(s.totalBs);
                return sum + (isNaN(num) ? 0 : num);
              }, 0)
              .toFixed(2)}
          </span>
        </div>

        <div className="space-y-2">
          {filteredSales.map((sale) => {
            const paymentDisplay = buildSalePaymentDisplayModel(sale);
            const iconMethod = hasValidMixedPaymentSplits(sale.paymentSplits)
              ? paymentDisplay.primaryMethod
              : sale.paymentMethod;
            const PaymentIcon = paymentIcons[iconMethod] || Banknote;
            const timeMs = getSafeTimestampForSorting(sale.createdAt);
            const time = new Date(timeMs).toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sale.id}
                className="bg-card rounded-xl p-4 border shadow-card space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        #{sale.dailyNumber || '-'}
                      </span>
                    </div>
                    <SalePaymentBreakdown
                      sale={sale}
                      paymentDisplay={paymentDisplay}
                      timeLabel={time}
                      paymentIcon={PaymentIcon}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(sale)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSaleToDelete(sale.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-1.5">
                  {(sale.items || []).map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                    >
                      {item.quantity}x {item.productName}
                      {item.liters && ` (${item.liters}L)`}
                    </span>
                  ))}
                </div>

                {sale.notes && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2">
                    {sale.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EditSaleSheet
        sale={editingSale}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      <Drawer
        open={saleToDelete !== null}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <DrawerContent className="p-4 sm:p-6 pb-8 sm:pb-10 sm:min-h-[360px]">
          <DrawerHeader className="px-0 pt-2">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="w-6 h-6" />
              Eliminar venta
            </DrawerTitle>
            <DrawerDescription className="text-sm pt-1">
              Esta acción no se puede deshacer. Se eliminará permanentemente
              este registro de la base de datos.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="px-0 pb-0 gap-3 pt-6 sm:pt-8">
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg sm:h-16 sm:text-lg"
              onClick={handleDelete}
            >
              Eliminar Permanentemente
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium border-border/50 bg-background sm:h-16 sm:text-lg"
              >
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
