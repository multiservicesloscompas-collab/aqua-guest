import { useEffect, useMemo, useState } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useMachineStore } from '@/store/useMachineStore';
import { getVenezuelaDate } from '@/services/DateService';
import {
  calculatePickupTime,
  formatPickupInfo,
  generateTimeSlots,
} from '@/utils/rentalSchedule';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import {
  PaymentMethod,
  PaymentMethodLabels,
  RentalShift,
  RentalShiftConfig,
  RentalStatus,
  RentalStatusLabels,
  WasherRental,
} from '@/types';

interface EditRentalSheetViewModelProps {
  rental: WasherRental | null;
  onOpenChange: (open: boolean) => void;
}

interface MachineItem {
  id: string;
  name: string;
  detail: string;
  isUnavailable: boolean;
}

interface ShiftOption {
  value: RentalShift;
  label: string;
  priceText: string;
}

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

const DELIVERY_FEE_OPTIONS = [0, 1, 2, 3, 4, 5];

export function useEditRentalSheetViewModel({
  rental,
  onOpenChange,
}: EditRentalSheetViewModelProps) {
  const { customers } = useCustomerStore();
  const { updateRental, rentals } = useRentalStore();
  const { washingMachines } = useMachineStore();

  const [machineId, setMachineId] = useState('');
  const [shift, setShift] = useState<RentalShift>('completo');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RentalStatus>('agendado');
  const [isPaid, setIsPaid] = useState(false);
  const [datePaid, setDatePaid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (!rental) return;
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
    setDatePaid(rental.datePaid || '');
  }, [rental]);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const pickupInfo = useMemo(() => {
    if (!rental) return { pickupDate: '', pickupTime: '' };
    const date = parse(rental.date, 'yyyy-MM-dd', new Date());
    return calculatePickupTime(date, deliveryTime, shift);
  }, [rental, deliveryTime, shift]);

  const totalUsd = useMemo(() => {
    return calculateRentalPrice(shift, paymentMethod, deliveryFee);
  }, [shift, paymentMethod, deliveryFee]);

  const unavailableMachines = useMemo(() => {
    if (!rental) return [] as string[];
    const requestedStart = new Date(`${rental.date}T${deliveryTime}`);
    const requestedEnd = new Date(
      `${pickupInfo.pickupDate}T${pickupInfo.pickupTime}`
    );

    return rentals
      .filter((r: WasherRental) => {
        if (r.id === rental.id) return false;
        if (r.status === 'finalizado') return false;
        const rentalStart = new Date(
          `${r.date}T${r.deliveryTime.substring(0, 5)}`
        );
        const rentalEnd = new Date(
          `${r.pickupDate}T${r.pickupTime.substring(0, 5)}`
        );
        return rentalStart < requestedEnd && rentalEnd > requestedStart;
      })
      .map((r: WasherRental) => r.machineId);
  }, [
    rentals,
    rental,
    deliveryTime,
    pickupInfo.pickupDate,
    pickupInfo.pickupTime,
  ]);

  const machineItems = useMemo<MachineItem[]>(
    () =>
      [...washingMachines]
        .sort((a, b) => b.kg - a.kg)
        .map((machine) => ({
          id: machine.id,
          name: `${machine.kg}KG`,
          detail: `${machine.name} - ${machine.brand}`,
          isUnavailable: unavailableMachines.includes(machine.id),
        })),
    [washingMachines, unavailableMachines]
  );

  const shiftOptions = useMemo<ShiftOption[]>(
    () =>
      (Object.keys(RentalShiftConfig) as RentalShift[]).map((key) => {
        const config = RentalShiftConfig[key];
        const price =
          key === 'completo' && paymentMethod === 'efectivo'
            ? 5
            : config.priceUsd;
        return {
          value: key,
          label: config.label,
          priceText: `$${price}`,
        };
      }),
    [paymentMethod]
  );

  const paymentMethodOptions = useMemo<PaymentMethodOption[]>(
    () => [
      { value: 'pago_movil', label: PaymentMethodLabels.pago_movil },
      { value: 'efectivo', label: PaymentMethodLabels.efectivo },
      { value: 'punto_venta', label: PaymentMethodLabels.punto_venta },
      { value: 'divisa', label: PaymentMethodLabels.divisa },
    ],
    []
  );

  const pickupLabel = useMemo(() => {
    if (!rental) return '';
    return formatPickupInfo(
      pickupInfo.pickupDate,
      pickupInfo.pickupTime,
      rental.date
    );
  }, [pickupInfo.pickupDate, pickupInfo.pickupTime, rental]);

  const paidDateLabel = useMemo(() => {
    if (!datePaid) return 'Seleccionar fecha';
    return format(
      parse(datePaid, 'yyyy-MM-dd', new Date()),
      "d 'de' MMMM, yyyy",
      {
        locale: es,
      }
    );
  }, [datePaid]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setSelectedCustomerId(customerId);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address);
  };

  const handleSubmit = async () => {
    if (!rental) return;

    if (!machineId) {
      toast.error('Selecciona una lavadora');
      return;
    }

    if (!customerName?.trim() || !customerAddress?.trim()) {
      toast.error('Completa nombre y dirección del cliente');
      return;
    }

    if (unavailableMachines.includes(machineId)) {
      toast.error('Esta lavadora no está disponible');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<WasherRental> = {
        machineId,
        shift,
        deliveryTime,
        pickupTime: pickupInfo.pickupTime,
        pickupDate: pickupInfo.pickupDate,
        deliveryFee,
        totalUsd,
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerName: customerName?.trim() || '',
        customerPhone: customerPhone?.trim() || '',
        customerAddress: customerAddress?.trim() || '',
        notes: notes?.trim() || undefined,
        status,
        isPaid,
        datePaid: isPaid ? datePaid || getVenezuelaDate() : (null as any),
      };

      await updateRental(rental.id, updates);
      toast.success('Alquiler actualizado');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al actualizar el alquiler:', error);
      toast.error(error.message || 'Error al actualizar el alquiler');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    customers,
    machineItems,
    shiftOptions,
    paymentMethodOptions,
    timeSlots,
    deliveryFeeOptions: DELIVERY_FEE_OPTIONS,
    pickupLabel,
    totalUsdText: totalUsd.toFixed(2),
    status,
    isPaid,
    datePaid,
    paidDateLabel,
    isCalendarOpen,
    setIsCalendarOpen,
    isLoading,
    selectedMachineId: machineId,
    selectedShift: shift,
    selectedPaymentMethod: paymentMethod,
    deliveryTime,
    deliveryFee,
    customerName,
    customerPhone,
    customerAddress,
    selectedCustomerId,
    notes,
    onSelectMachine: setMachineId,
    onSelectShift: setShift,
    onSelectPaymentMethod: setPaymentMethod,
    onSelectDeliveryTime: setDeliveryTime,
    onSelectDeliveryFee: setDeliveryFee,
    onChangeCustomerName: setCustomerName,
    onChangeCustomerPhone: setCustomerPhone,
    onChangeCustomerAddress: setCustomerAddress,
    onSelectCustomer: handleCustomerSelect,
    onChangeNotes: setNotes,
    onChangeStatus: setStatus,
    onChangePaymentStatus: (value: 'paid' | 'pending') => {
      const paid = value === 'paid';
      setIsPaid(paid);
      if (paid && !datePaid) {
        setDatePaid(getVenezuelaDate());
      }
    },
    onChangeDatePaid: (value: string) => setDatePaid(value),
    onSubmit: handleSubmit,
    statusOptions: Object.entries(RentalStatusLabels).map(([key, label]) => ({
      value: key as RentalStatus,
      label,
    })),
  };
}
