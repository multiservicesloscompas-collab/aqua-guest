import { RentalShiftConfig, RentalShift, BUSINESS_HOURS } from '@/types';
import {
  format,
  addDays,
  setHours,
  setMinutes,
  parse,
  isAfter,
  isBefore,
  getDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function calculatePickupTime(
  deliveryDate: Date,
  deliveryTime: string, // HH:mm
  shift: RentalShift
): { pickupTime: string; pickupDate: string } {
  if (!deliveryTime) {
    return {
      pickupTime: format(deliveryDate, 'HH:mm'),
      pickupDate: format(deliveryDate, 'yyyy-MM-dd'),
    };
  }

  const shiftConfig = RentalShiftConfig[shift];
  if (!shiftConfig) {
    return {
      pickupTime: format(deliveryDate, 'HH:mm'),
      pickupDate: format(deliveryDate, 'yyyy-MM-dd'),
    };
  }

  const [hours, minutes] = deliveryTime.split(':').map(Number);

  const deliveryDateTime = setMinutes(setHours(deliveryDate, hours), minutes);

  let pickupDateTime = new Date(
    deliveryDateTime.getTime() + shiftConfig.hours * 60 * 60 * 1000
  );

  const pickupDay = getDay(pickupDateTime);
  const isSunday = pickupDay === 0;
  const openHour = BUSINESS_HOURS.openHour;
  const closeHour = isSunday
    ? BUSINESS_HOURS.sundayCloseHour
    : BUSINESS_HOURS.closeHour;
  const openTime = setMinutes(setHours(new Date(pickupDateTime), openHour), 0);
  const closeTime = setMinutes(
    setHours(new Date(pickupDateTime), closeHour),
    0
  );

  const isExceptionDelivery =
    deliveryTime === '13:00' || deliveryTime === '14:00';
  const sameDay =
    format(pickupDateTime, 'yyyy-MM-dd') === format(deliveryDate, 'yyyy-MM-dd');

  const isWithinBusinessHours =
    !isBefore(pickupDateTime, openTime) && !isAfter(pickupDateTime, closeTime);

  if (!isWithinBusinessHours) {
    if (isExceptionDelivery && sameDay && isAfter(pickupDateTime, closeTime)) {
      pickupDateTime = setMinutes(setHours(deliveryDate, 20), 0);
    } else {
      if (
        BUSINESS_HOURS.workDays.includes(pickupDay) &&
        isBefore(pickupDateTime, openTime)
      ) {
        pickupDateTime = openTime;
      } else {
        // Mover al siguiente día laboral a la hora de apertura
        let nextDay = addDays(new Date(pickupDateTime), 1);
        while (!BUSINESS_HOURS.workDays.includes(getDay(nextDay))) {
          nextDay = addDays(nextDay, 1);
        }
        pickupDateTime = setMinutes(
          setHours(nextDay, BUSINESS_HOURS.openHour),
          0
        );
      }
    }
  }

  return {
    pickupTime: format(pickupDateTime, 'HH:mm'),
    pickupDate: format(pickupDateTime, 'yyyy-MM-dd'),
  };
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (
    let hour = BUSINESS_HOURS.openHour;
    hour < BUSINESS_HOURS.closeHour;
    hour++
  ) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

export function isWorkDay(date: Date): boolean {
  return BUSINESS_HOURS.workDays.includes(getDay(date));
}

export function formatPickupInfo(
  pickupDate: string,
  pickupTime: string,
  deliveryDate: string
): string {
  const isSameDay = pickupDate === deliveryDate;

  if (isSameDay) {
    return `Hoy a las ${pickupTime}`;
  }

  const date = parse(pickupDate, 'yyyy-MM-dd', new Date());
  return `${format(date, "EEEE d 'de' MMMM", {
    locale: es,
  })} a las ${pickupTime}`;
}
