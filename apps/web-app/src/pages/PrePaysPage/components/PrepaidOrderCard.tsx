/**
 * PrepaidOrderCard.tsx
 * Renders a single prepaid order with actions.
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Droplets, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import {
  PaymentMethodLabels,
  PrepaidStatusLabels,
  PrepaidStatusColors,
  PrepaidOrder,
} from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrepaidOrderCardProps {
  order: PrepaidOrder;
  isMarkingDelivered: boolean;
  isDeleting: boolean;
  deletingId: string | null;
  onEdit: (id: string) => void;
  onMarkDelivered: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return 'Fecha inválida';
  }
}

export function PrepaidOrderCard({
  order,
  isMarkingDelivered,
  isDeleting,
  deletingId,
  onEdit,
  onMarkDelivered,
  onDelete,
}: PrepaidOrderCardProps) {
  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{order.customerName}</p>
          </div>
        </div>
        <Badge className={cn('border', PrepaidStatusColors[order.status])}>
          {PrepaidStatusLabels[order.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Litros</p>
          <p className="font-medium">{order.liters}L</p>
        </div>
        <div>
          <p className="text-muted-foreground">Monto</p>
          <p className="font-medium">{(order.amountBs ?? 0).toFixed(2)} Bs</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fecha de pago</p>
          <p className="font-medium">{formatDate(order.datePaid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Método</p>
          <p className="font-medium">
            {PaymentMethodLabels[order.paymentMethod]}
          </p>
        </div>
      </div>

      {order.notes && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
          {order.notes}
        </p>
      )}

      {order.status === 'entregado' && order.dateDelivered && (
        <p className="text-xs text-muted-foreground">
          Entregado: {formatDate(order.dateDelivered)}
        </p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t">
        {order.status === 'pendiente' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                disabled={isMarkingDelivered}
              >
                <Check className="w-4 h-4 mr-1" />
                Marcar Entregado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar entrega?</AlertDialogTitle>
                <AlertDialogDescription>
                  Marcarás como entregado el pedido de {order.liters}L para{' '}
                  {order.customerName}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isMarkingDelivered}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onMarkDelivered(order.id)}
                  disabled={isMarkingDelivered}
                >
                  {isMarkingDelivered ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isMarkingDelivered ? 'Marcando...' : 'Confirmar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button variant="outline" size="sm" onClick={() => onEdit(order.id)}>
          <Edit className="w-4 h-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isDeleting}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(order.id)}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && deletingId === order.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
