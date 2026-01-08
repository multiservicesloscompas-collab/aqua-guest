import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Droplets, User, Edit, Trash2, Check } from 'lucide-react';
import {
  PaymentMethod,
  PaymentMethodLabels,
  PrepaidStatusLabels,
  PrepaidStatusColors,
  PrepaidStatus,
} from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function PrepagadosPage() {
  const {
    prepaidOrders,
    config,
    getPriceForLiters,
    addPrepaidOrder,
    updatePrepaidOrder,
    deletePrepaidOrder,
    markPrepaidAsDelivered,
  } = useAppStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PrepaidStatus | 'todos'>(
    'pendiente'
  );

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [liters, setLiters] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCustomerName('');
    setLiters('');
    setPaymentMethod('pago_movil');
    setNotes('');
    setEditingOrder(null);
  };

  const handleOpenSheet = () => {
    resetForm();
    setSheetOpen(true);
  };

  const handleEdit = (orderId: string) => {
    const order = prepaidOrders.find((o) => o.id === orderId);
    if (order) {
      setCustomerName(order.customerName);
      setLiters(order.liters.toString());
      setPaymentMethod(order.paymentMethod);
      setNotes(order.notes || '');
      setEditingOrder(orderId);
      setSheetOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !liters) return;

    const litersNum = Number(liters);
    const amountBs = getPriceForLiters(litersNum);
    const amountUsd = amountBs / config.exchangeRate;

    const payloadForLog = {
      customerName: customerName.trim(),
      liters: litersNum,
      amountBs,
      amountUsd,
      paymentMethod,
    };
    console.debug('PrepagadosPage handleSubmit payload=', payloadForLog);

    setSaving(true);
    try {
      if (editingOrder) {
        await updatePrepaidOrder(editingOrder, {
          customerName: customerName.trim(),
          liters: litersNum,
          amountBs,
          amountUsd,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
        toast.success('Prepago actualizado');
      } else {
        await addPrepaidOrder({
          customerName: customerName.trim(),
          liters: litersNum,
          amountBs,
          amountUsd,
          exchangeRate: config.exchangeRate,
          paymentMethod,
          status: 'pendiente',
          datePaid: new Date().toISOString().split('T')[0],
          notes: notes.trim() || undefined,
        });
        toast.success('Prepago registrado');
      }

      setSheetOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Error guardando el prepago');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = prepaidOrders.filter((order) =>
    filterStatus === 'todos' ? true : order.status === filterStatus
  );

  const pendingCount = prepaidOrders.filter(
    (o) => o.status === 'pendiente'
  ).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Agua Prepagada" />

      <div className="p-4 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === 'pendiente' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pendiente')}
            className="flex-1"
          >
            Pendientes ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'entregado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('entregado')}
            className="flex-1"
          >
            Entregados
          </Button>
          <Button
            variant={filterStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('todos')}
            className="flex-1"
          >
            Todos
          </Button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              No hay pedidos{' '}
              {filterStatus === 'pendiente'
                ? 'pendientes'
                : filterStatus === 'entregado'
                ? 'entregados'
                : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-xl border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                  </div>
                  <Badge
                    className={cn('border', PrepaidStatusColors[order.status])}
                  >
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
                    <p className="font-medium">
                      {(order.amountBs ?? 0).toFixed(2)} Bs
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha de pago</p>
                    <p className="font-medium">
                      {(() => {
                        try {
                          return format(
                            new Date(order.datePaid),
                            'dd MMM yyyy',
                            {
                              locale: es,
                            }
                          );
                        } catch {
                          return 'Fecha inválida';
                        }
                      })()}
                    </p>
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
                    Entregado:{' '}
                    {(() => {
                      try {
                        return format(
                          new Date(order.dateDelivered),
                          'dd MMM yyyy',
                          {
                            locale: es,
                          }
                        );
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {order.status === 'pendiente' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" size="sm" className="flex-1">
                          <Check className="w-4 h-4 mr-1" />
                          Marcar Entregado
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Confirmar entrega?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Marcarás como entregado el pedido de {order.liters}L
                            para {order.customerName}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => markPrepaidAsDelivered(order.id)}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(order.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
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
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePrepaidOrder(order.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Button
        onClick={handleOpenSheet}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingOrder ? 'Editar Prepago' : 'Nuevo Prepago'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pb-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del Cliente *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liters">Litros *</Label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="liters"
                  type="number"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="Cantidad de litros"
                  className="pl-10"
                  min="1"
                />
              </div>
              {liters && (
                <p className="text-sm text-muted-foreground">
                  Precio: {getPriceForLiters(Number(liters)).toFixed(2)} Bs
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="punto_venta">Punto de Venta</SelectItem>
                  <SelectItem value="divisa">Divisa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!customerName.trim() || !liters || saving}
              className="w-full"
              size="lg"
            >
              {saving
                ? 'Guardando...'
                : editingOrder
                ? 'Guardar Cambios'
                : 'Registrar Prepago'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
