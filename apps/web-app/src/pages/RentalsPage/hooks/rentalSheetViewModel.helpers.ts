import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PaymentMethod, RentalShift, WasherRental } from '@/types';
import {
  BUSINESS_HOURS,
  PaymentMethodLabels,
  RentalShiftConfig,
} from '@/types';

export interface MachineItem {
  id: string;
  name: string;
  detail: string;
  isUnavailable: boolean;
}

export interface ShiftOption {
  value: RentalShift;
  label: string;
  priceText: string;
}

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

export const DELIVERY_FEE_OPTIONS = [0, 1, 2, 3, 4, 5];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'pago_movil', label: PaymentMethodLabels.pago_movil },
  { value: 'efectivo', label: PaymentMethodLabels.efectivo },
  { value: 'punto_venta', label: PaymentMethodLabels.punto_venta },
  { value: 'divisa', label: PaymentMethodLabels.divisa },
];

export function getDefaultDeliveryTime() {
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

export function mapMachineItems(params: {
  washingMachines: Array<{
    id: string;
    kg: number;
    name: string;
    brand: string;
  }>;
  unavailableMachines: string[];
}): MachineItem[] {
  return [...params.washingMachines]
    .sort((a, b) => b.kg - a.kg)
    .map((machine) => ({
      id: machine.id,
      name: `${machine.kg}KG`,
      detail: `${machine.name} - ${machine.brand}`,
      isUnavailable: params.unavailableMachines.includes(machine.id),
    }));
}

export function mapShiftOptions(paymentMethod: PaymentMethod): ShiftOption[] {
  return (Object.keys(RentalShiftConfig) as RentalShift[]).map((key) => {
    const config = RentalShiftConfig[key];
    const price =
      key === 'completo' && paymentMethod === 'divisa' ? 5 : config.priceUsd;
    return {
      value: key,
      label: config.label,
      priceText: `$${price}`,
    };
  });
}

export function getUnavailableMachineIds(params: {
  rentals: WasherRental[];
  selectedDate: string;
  deliveryTime: string;
  pickupDate: string;
  pickupTime: string;
}): string[] {
  const requestedStart = new Date(
    `${params.selectedDate}T${params.deliveryTime}`
  );
  const requestedEnd = new Date(`${params.pickupDate}T${params.pickupTime}`);

  return params.rentals
    .filter((rental) => {
      if (rental.status === 'finalizado') return false;
      const rentalStart = new Date(
        `${rental.date}T${rental.deliveryTime.substring(0, 5)}`
      );
      const rentalEnd = new Date(
        `${rental.pickupDate}T${rental.pickupTime.substring(0, 5)}`
      );
      return rentalStart < requestedEnd && rentalEnd > requestedStart;
    })
    .map((rental) => rental.machineId);
}

export function getRentalValidationError(params: {
  machineId: string;
  customerName: string;
  customerAddress: string;
  unavailableMachines: string[];
}): string | null {
  if (!params.machineId) return 'Selecciona una lavadora';
  if (!params.customerName.trim() || !params.customerAddress.trim()) {
    return 'Completa nombre y dirección del cliente';
  }
  if (params.unavailableMachines.includes(params.machineId)) {
    return 'Esta lavadora no está disponible';
  }
  return null;
}

export function getPaidDateLabel(datePaid: string): string {
  if (!datePaid) return 'Seleccionar fecha';

  return format(
    parse(datePaid, 'yyyy-MM-dd', new Date()),
    "d 'de' MMMM, yyyy",
    {
      locale: es,
    }
  );
}
