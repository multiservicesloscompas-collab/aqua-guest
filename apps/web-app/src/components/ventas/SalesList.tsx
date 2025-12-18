import { useState } from 'react';
import { Sale, PaymentMethodLabels } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, Smartphone, Banknote, CreditCard, FileText, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditSaleSheet } from './EditSaleSheet';
import { toast } from 'sonner';

interface SalesListProps {
  sales: Sale[];
}

const paymentIcons = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
};

export function SalesList({ sales }: SalesListProps) {
  const { deleteSale } = useAppStore();
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const handleDelete = (id: string) => {
    deleteSale(id);
    toast.success('Venta eliminada');
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditSheetOpen(true);
  };

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Sin ventas este día</p>
        <p className="text-xs">Presiona + para agregar una venta</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Ventas del Día ({sales.length})
          </h3>
          <span className="text-sm font-bold text-primary">
            Bs {sales.reduce((sum, s) => sum + s.totalBs, 0).toFixed(2)}
          </span>
        </div>

        <div className="space-y-2">
          {sales.map((sale) => {
            const PaymentIcon = paymentIcons[sale.paymentMethod];
            const time = new Date(sale.createdAt).toLocaleTimeString('es-VE', {
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
                    <div className="p-2 bg-primary/10 rounded-full">
                      <PaymentIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Bs {sale.totalBs.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${sale.totalUsd.toFixed(2)} • {time}
                      </p>
                    </div>
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente
                            este registro.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(sale.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-1.5">
                  {sale.items.map((item, idx) => (
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
    </>
  );
}
