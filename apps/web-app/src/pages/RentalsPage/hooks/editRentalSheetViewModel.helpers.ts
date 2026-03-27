import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PaymentMethod,
  PaymentMethodLabels,
  RentalShift,
  RentalShiftConfig,
  WasherRental,
} from '@/types';
import { resolveSplitFormHydrationState } from '@/services/payments/paymentSplitFormHydration';

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

function resolveRentalTotalBs(
  rental: WasherRental,
  exchangeRate: number
): number {
  if (rental.paymentSplits?.length) {
    const splitSumBs = rental.paymentSplits.reduce(
      (sum, split) => sum + Number(split.amountBs || 0),
      0
    );
    if (splitSumBs > 0) {
      return splitSumBs;
    }
  }

  return Number(rental.totalUsd || 0) * exchangeRate;
}

export function resolveRentalSplitState(
  rental: WasherRental,
  exchangeRate: number
) {
  return resolveSplitFormHydrationState({
    paymentMethod: rental.paymentMethod,
    paymentSplits: rental.paymentSplits,
    totalBs: resolveRentalTotalBs(rental, exchangeRate),
  });
}

export function getUnavailableMachineIds(params: {
  rentals: WasherRental[];
  currentRentalId: string;
  currentDate: string;
  deliveryTime: string;
  pickupDate: string;
  pickupTime: string;
}): string[] {
  const requestedStart = new Date(
    `${params.currentDate}T${params.deliveryTime}`
  );
  const requestedEnd = new Date(`${params.pickupDate}T${params.pickupTime}`);

  return params.rentals
    .filter((rental) => {
      if (rental.id === params.currentRentalId) return false;
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

export function mapMachineItems(params: {
  washingMachines: Array<{
    id: string;
    kg: number;
    name: string;
    brand: string;
  }>;
  unavailableMachineIds: string[];
}): MachineItem[] {
  return [...params.washingMachines]
    .sort((a, b) => b.kg - a.kg)
    .map((machine) => ({
      id: machine.id,
      name: `${machine.kg}KG`,
      detail: `${machine.name} - ${machine.brand}`,
      isUnavailable: params.unavailableMachineIds.includes(machine.id),
    }));
}

export function mapShiftOptions(paymentMethod: PaymentMethod): ShiftOption[] {
  return (Object.keys(RentalShiftConfig) as RentalShift[]).map((key) => {
    const config = RentalShiftConfig[key];
    const price =
      key === 'completo' && paymentMethod === 'efectivo' ? 5 : config.priceUsd;

    return {
      value: key,
      label: config.label,
      priceText: `$${price}`,
    };
  });
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'pago_movil', label: PaymentMethodLabels.pago_movil },
  { value: 'efectivo', label: PaymentMethodLabels.efectivo },
  { value: 'punto_venta', label: PaymentMethodLabels.punto_venta },
  { value: 'divisa', label: PaymentMethodLabels.divisa },
];

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
