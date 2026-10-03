import type { RentalShiftDefinition } from '@aqua-guest/domain';
import { BUSINESS_HOURS } from '@/types';
import {
  addDays,
  format,
  getDay,
  isAfter,
  isBefore,
  parse,
  setHours,
  setMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';

function getBusinessHoursWindow(date: Date): {
  openTime: Date;
  closeTime: Date;
} {
  const isSunday = getDay(date) === 0;
  const closeHour = isSunday
    ? BUSINESS_HOURS.sundayCloseHour
    : BUSINESS_HOURS.closeHour;

  return {
    openTime: setMinutes(setHours(new Date(date), BUSINESS_HOURS.openHour), 0),
    closeTime: setMinutes(setHours(new Date(date), closeHour), 0),
  };
}

export function clampToBusinessHours(dateTime: Date): Date {
  const { openTime, closeTime } = getBusinessHoursWindow(dateTime);

  const isWithinBusinessHours =
    !isBefore(dateTime, openTime) && !isAfter(dateTime, closeTime);
  if (isWithinBusinessHours) {
    return dateTime;
  }

  if (
    BUSINESS_HOURS.workDays.includes(getDay(dateTime)) &&
    isBefore(dateTime, openTime)
  ) {
    return openTime;
  }

  let nextDay = addDays(new Date(dateTime), 1);
  while (!BUSINESS_HOURS.workDays.includes(getDay(nextDay))) {
    nextDay = addDays(nextDay, 1);
  }
  return setMinutes(setHours(nextDay, BUSINESS_HOURS.openHour), 0);
}

export function calculatePickupTime(
  deliveryDate: Date,
  deliveryTime: string,
  shift: Pick<RentalShiftDefinition, 'hours'>
): { pickupTime: string; pickupDate: string } {
  if (!deliveryTime) {
    return {
      pickupTime: format(deliveryDate, 'HH:mm'),
      pickupDate: format(deliveryDate, 'yyyy-MM-dd'),
    };
  }

  const [hours, minutes] = deliveryTime.split(':').map(Number);

  const deliveryDateTime = setMinutes(setHours(deliveryDate, hours), minutes);

  let pickupDateTime = new Date(
    deliveryDateTime.getTime() + shift.hours * 60 * 60 * 1000
  );

  const { closeTime } = getBusinessHoursWindow(pickupDateTime);

  const isExceptionDelivery =
    deliveryTime === '13:00' || deliveryTime === '14:00';
  const sameDay =
    format(pickupDateTime, 'yyyy-MM-dd') === format(deliveryDate, 'yyyy-MM-dd');
  const closesLate = getDay(pickupDateTime) !== 0;

  if (
    isExceptionDelivery &&
    sameDay &&
    closesLate &&
    isAfter(pickupDateTime, closeTime)
  ) {
    pickupDateTime = setMinutes(setHours(deliveryDate, 20), 0);
  } else {
    pickupDateTime = clampToBusinessHours(pickupDateTime);
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
