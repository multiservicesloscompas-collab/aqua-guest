import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PaymentMethod, RentalShift, WasherRental } from '@/types';
import type { SelectOption } from '@/types/ui';
import { BUSINESS_HOURS, PaymentMethodLabels } from '@/types';
import type { RentalShiftCatalog } from '@/utils/shiftCatalog';
import { calculateRentalPrice } from '@/utils/rentalPricing';

export interface MachineItem {
  id: string;
  name: string;
  detail: string;
  isUnavailable: boolean;
}

export interface ShiftOption extends SelectOption<RentalShift> {
  priceText: string;
}

export type PaymentMethodOption = SelectOption<PaymentMethod>;

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

export function mapShiftOptions(
  shifts: RentalShiftCatalog,
  paymentMethod: PaymentMethod
): ShiftOption[] {
  return shifts.map((definition) => ({
    value: definition.id,
    label: definition.label,
    priceText: `$${calculateRentalPrice(definition, paymentMethod, 0)}`,
  }));
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
