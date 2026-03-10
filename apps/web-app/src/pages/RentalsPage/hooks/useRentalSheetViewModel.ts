import { useEffect, useMemo, useState } from 'react';
import { parse } from 'date-fns';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useConfigStore } from '@/store/useConfigStore';
import type { PaymentSplit } from '@/types/paymentSplits';
import {
  BUSINESS_HOURS,
  PaymentMethod,
  PaymentMethodLabels,
  RentalShift,
  RentalShiftConfig,
  WasherRental,
} from '@/types';
import {
  calculatePickupTime,
  formatPickupInfo,
  generateTimeSlots,
} from '@/utils/rentalSchedule';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';

interface RentalSheetViewModelProps {
  open: boolean;
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

function getDefaultDeliveryTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (
    currentHour < BUSINESS_HOURS.openHour ||
    currentHour >= BUSINESS_HOURS.closeHour
  ) {
    return '09:00';
  }

  const roundedMinute = currentMinute < 30 ? 0 : 30;
  return `${currentHour.toString().padStart(2, '0')}:${roundedMinute
    .toString()
    .padStart(2, '0')}`;
}

export function useRentalSheetViewModel({
  open,
  onOpenChange,
}: RentalSheetViewModelProps) {
  const { selectedDate } = useAppStore();
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('rentals')
  );
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const { customers } = useCustomerStore();
  const { addRental, rentals } = useRentalStore();
  const { washingMachines } = useMachineStore();

  const [machineId, setMachineId] = useState('');
  const [shift, setShift] = useState<RentalShift>('completo');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('pago_movil');
  const [split1Amount, setSplit1Amount] = useState('');
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDeliveryTime(getDefaultDeliveryTime());
    }
  }, [open]);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const pickupInfo = useMemo(() => {
    const date = parse(selectedDate, 'yyyy-MM-dd', new Date());
    return calculatePickupTime(date, deliveryTime, shift);
  }, [selectedDate, deliveryTime, shift]);

  const totalUsd = useMemo(() => {
    return calculateRentalPrice(shift, paymentMethod, deliveryFee);
  }, [shift, paymentMethod, deliveryFee]);
  const totalBs = useMemo(
    () => totalUsd * exchangeRate,
    [totalUsd, exchangeRate]
  );

  const hasMixedPaymentEnabled = isMixedPaymentEnabled && isMixedPayment;

  const paymentSplits = useMemo<PaymentSplit[]>(() => {
    return buildDualPaymentSplits({
      enableMixedPayment: hasMixedPaymentEnabled,
      primaryMethod: paymentMethod,
      secondaryMethod: split2Method,
      amountInput: split1Amount,
      amountInputMode: 'primary',
      totalBs,
      totalUsd,
      exchangeRate,
    });
  }, [
    exchangeRate,
    hasMixedPaymentEnabled,
    paymentMethod,
    split1Amount,
    split2Method,
    totalBs,
    totalUsd,
  ]);

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, split2Method]);

  const unavailableMachines = useMemo(() => {
    const requestedStart = new Date(`${selectedDate}T${deliveryTime}`);
    const requestedEnd = new Date(
      `${pickupInfo.pickupDate}T${pickupInfo.pickupTime}`
    );

    return rentals
      .filter((r: WasherRental) => {
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
    selectedDate,
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
          key === 'completo' && paymentMethod === 'divisa'
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
    return formatPickupInfo(
      pickupInfo.pickupDate,
      pickupInfo.pickupTime,
      selectedDate
    );
  }, [pickupInfo.pickupDate, pickupInfo.pickupTime, selectedDate]);

  const resetForm = () => {
    setMachineId('');
    setShift('completo');
    setDeliveryTime(getDefaultDeliveryTime());
    setDeliveryFee(0);
    setPaymentMethod('efectivo');
    setSplit2Method('pago_movil');
    setSplit1Amount('');
    setIsMixedPayment(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setNotes('');
  };

  const validateRentalForm = () => {
    if (!machineId) {
      toast.error('Selecciona una lavadora');
      return false;
    }

    if (!customerName.trim() || !customerAddress.trim()) {
      toast.error('Completa nombre y dirección del cliente');
      return false;
    }

    if (unavailableMachines.includes(machineId)) {
      toast.error('Esta lavadora no está disponible');
      return false;
    }

    return true;
  };

  const handleCustomerSelect = (customerId: string | null) => {
    if (!customerId) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }

    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;

    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address);
  };

  const handleCreateNewCustomer = () => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');

    setTimeout(() => {
      const nameInput = document.querySelector(
        'input[placeholder="Nombre del cliente"]'
      ) as HTMLInputElement | null;
      nameInput?.focus();
    }, 0);
  };

  const handleSubmit = async () => {
    if (!validateRentalForm()) return;

    setIsSaving(true);
    try {
      const splitValidation = normalizeAndValidatePaymentSplits({
        splits: paymentSplits,
        totalBs,
        totalUsd,
      });
      if (!splitValidation.validation.ok) {
        toast.error(splitValidation.validation.errors[0]);
        return;
      }

      await addRental({
        date: selectedDate,
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        machineId,
        shift,
        deliveryTime,
        pickupTime: pickupInfo.pickupTime,
        pickupDate: pickupInfo.pickupDate,
        deliveryFee,
        totalUsd,
        paymentMethod,
        paymentSplits: splitValidation.splits,
        status: 'agendado',
        isPaid: false,
        notes: notes.trim() || undefined,
      });

      toast.success('Alquiler registrado');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error('Error registrando alquiler:', err);
      toast.error(err.message || 'Error al registrar el alquiler');
    } finally {
      setIsSaving(false);
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
    selectedMachineId: machineId,
    selectedShift: shift,
    selectedPaymentMethod: paymentMethod,
    totalBs,
    split2Method,
    split1Amount,
    isMixedPaymentEnabled,
    isMixedPayment,
    deliveryTime,
    deliveryFee,
    customerName,
    customerPhone,
    customerAddress,
    selectedCustomerId,
    notes,
    isSaving,
    onSelectMachine: setMachineId,
    onSelectShift: setShift,
    onSelectPaymentMethod: setPaymentMethod,
    onSelectSplit2Method: setSplit2Method,
    onChangeSplit1Amount: setSplit1Amount,
    onToggleMixedPayment: () => {
      setIsMixedPayment((current) => {
        const next = !current;
        if (!next) {
          setSplit1Amount('');
        }
        return next;
      });
    },
    onSelectDeliveryTime: setDeliveryTime,
    onSelectDeliveryFee: setDeliveryFee,
    onChangeCustomerName: setCustomerName,
    onChangeCustomerPhone: setCustomerPhone,
    onChangeCustomerAddress: setCustomerAddress,
    onChangeNotes: setNotes,
    onSelectCustomer: handleCustomerSelect,
    onCreateNewCustomer: handleCreateNewCustomer,
    onSubmit: handleSubmit,
  };
}
