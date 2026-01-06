import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  WashingMachine,
  Truck,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Phone,
  Smartphone,
  Banknote,
  CreditCard,
  Pencil,
} from 'lucide-react';
import {
  WasherRental,
  RentalShift,
  RentalShiftConfig,
  RentalStatus,
  RentalStatusLabels,
  PaymentMethod,
  PaymentMethodLabels,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
  calculatePickupTime,
  generateTimeSlots,
  formatPickupInfo,
} from '@/utils/rentalSchedule';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import { parse, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface EditRentalSheetProps {
  rental: WasherRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRentalSheet({
  rental,
  open,
  onOpenChange,
}: EditRentalSheetProps) {
  const { updateRental, washingMachines, rentals, customers } = useAppStore();

  const [machineId, setMachineId] = useState<string>('');
  const [shift, setShift] = useState<RentalShift>('completo');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RentalStatus>('agendado');
  const [isPaid, setIsPaid] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    if (rental) {
      setMachineId(rental.machineId);
      setShift(rental.shift);
      setDeliveryTime(rental.deliveryTime.substring(0, 5));
      setDeliveryFee(rental.deliveryFee);
      setCustomerName(rental.customerName);
      setCustomerPhone(rental.customerPhone);
      setCustomerAddress(rental.customerAddress);
      setSelectedCustomerId(rental.customerId || '');
      setPaymentMethod(rental.paymentMethod || 'efectivo');
      setNotes(rental.notes || '');
      setStatus(rental.status);
      setIsPaid(rental.isPaid);
    }
  }, [rental]);

  // Calcular hora de retiro
  const pickupInfo = useMemo(() => {
    if (!rental) return { pickupDate: '', pickupTime: '' };
    const date = parse(rental.date, 'yyyy-MM-dd', new Date());
    return calculatePickupTime(date, deliveryTime, shift);
  }, [rental?.date, deliveryTime, shift]);

  // Precio total con regla de negocio especial
  const totalUsd = useMemo(() => {
    return calculateRentalPrice(shift, paymentMethod, deliveryFee);
  }, [shift, paymentMethod, deliveryFee]);

  // Verificar disponibilidad de lavadora (excluyendo el alquiler actual)
  const unavailableMachines = useMemo(() => {
    if (!rental) return [];
    return rentals
      .filter(
        (r) =>
          r.date === rental.date &&
          r.status !== 'finalizado' &&
          r.id !== rental.id
      )
      .map((r) => r.machineId);
  }, [rentals, rental]);

  // Autocompletar cliente
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerAddress(customer.address);
    }
  };

  const handleSubmit = () => {
    if (!rental) return;

    if (!machineId) {
      toast.error('Selecciona una lavadora');
      return;
    }

    if (!customerName.trim() || !customerAddress.trim()) {
      toast.error('Completa nombre y dirección del cliente');
      return;
    }

    if (unavailableMachines.includes(machineId)) {
      toast.error('Esta lavadora no está disponible');
      return;
    }

    updateRental(rental.id, {
      machineId,
      shift,
      deliveryTime,
      pickupTime: pickupInfo.pickupTime,
      pickupDate: pickupInfo.pickupDate,
      deliveryFee,
      totalUsd,
      paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      notes: notes.trim() || undefined,
      status,
      isPaid,
    });

    toast.success('Alquiler actualizado');
    onOpenChange(false);
  };

  if (!rental) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Alquiler
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-8rem)] space-y-6 pb-40">
          {/* Estado y Pago */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as RentalStatus)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RentalStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pago</Label>
              <Select
                value={isPaid ? 'paid' : 'pending'}
                onValueChange={(v) => setIsPaid(v === 'paid')}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selección de Lavadora */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <WashingMachine className="w-4 h-4" />
              Lavadora
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {washingMachines.map((machine) => {
                const isUnavailable = unavailableMachines.includes(machine.id);
                return (
                  <Button
                    key={machine.id}
                    type="button"
                    variant={machineId === machine.id ? 'default' : 'outline'}
                    disabled={isUnavailable}
                    onClick={() => setMachineId(machine.id)}
                    className="h-16 text-sm relative flex flex-col gap-0.5 p-2"
                  >
                    <span className="font-medium">{machine.name}</span>
                    <span className="text-xs opacity-70">{machine.kg}kg</span>
                    {isUnavailable && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 text-[10px] px-1"
                      >
                        Ocupada
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Tipo de Jornada */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Jornada
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(RentalShiftConfig) as RentalShift[]).map((s) => {
                const config = RentalShiftConfig[s];
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={shift === s ? 'default' : 'outline'}
                    onClick={() => setShift(s)}
                    className="h-14 flex flex-col gap-0.5 p-2"
                  >
                    <span className="text-xs">{config.label}</span>
                    <span className="text-sm font-bold">
                      {s === 'completo' && paymentMethod === 'efectivo' 
                        ? '$5' 
                        : `$${config.priceUsd}`
                      }
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Método de Pago
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'pago_movil' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('pago_movil')}
                className="h-14 flex flex-col gap-1 p-2"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">
                  {PaymentMethodLabels.pago_movil}
                </span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('efectivo')}
                className="h-14 flex flex-col gap-1 p-2"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">{PaymentMethodLabels.efectivo}</span>
              </Button>
              <Button
                type="button"
                variant={
                  paymentMethod === 'punto_venta' ? 'default' : 'outline'
                }
                onClick={() => setPaymentMethod('punto_venta')}
                className="h-14 flex flex-col gap-1 p-2"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">
                  {PaymentMethodLabels.punto_venta}
                </span>
              </Button>
            </div>
          </div>

          {/* Hora de Entrega */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Hora de Entrega
            </Label>
            <Select value={deliveryTime} onValueChange={setDeliveryTime}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="bg-accent/50 rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Retiro: </span>
                <span className="font-medium">
                  {formatPickupInfo(
                    pickupInfo.pickupDate,
                    pickupInfo.pickupTime,
                    rental.date
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Cargo de Delivery */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Cargo de Delivery
            </Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((fee) => (
                <Button
                  key={fee}
                  type="button"
                  variant={deliveryFee === fee ? 'default' : 'outline'}
                  onClick={() => setDeliveryFee(fee)}
                  className="flex-1 h-10"
                >
                  ${fee}
                </Button>
              ))}
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </Label>

            <Select
              value={selectedCustomerId}
              onValueChange={(value) => {
                if (value === 'new') {
                  setSelectedCustomerId('');
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerAddress('');
                } else {
                  handleCustomerSelect(value);
                }
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Seleccionar o crear cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Nuevo cliente</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      {customer.address && (
                        <span className="text-xs text-muted-foreground">
                          {customer.address}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3">
              <Input
                placeholder="Nombre del cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12"
              />
              <Input
                placeholder="Teléfono"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-12"
              />
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Dirección de entrega"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer con Total y Botón */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border safe-bottom">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{totalUsd.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold"
            style={{
              marginBottom: '4rem',
              marginTop: '2rem',
            }}
          >
            Guardar Cambios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
