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

/**
 * Calcula la hora y fecha de retiro de una lavadora
 * respetando el horario comercial (Lunes-Sábado 9AM-8PM, Domingo 9AM-2PM)
 */
export function calculatePickupTime(
  deliveryDate: Date,
  deliveryTime: string, // HH:mm
  shift: RentalShift
): { pickupTime: string; pickupDate: string } {
  const shiftConfig = RentalShiftConfig[shift];
  const [hours, minutes] = deliveryTime.split(':').map(Number);

  // Crear fecha/hora de entrega
  let deliveryDateTime = setMinutes(setHours(deliveryDate, hours), minutes);

  // Agregar horas del turno
  let pickupDateTime = new Date(
    deliveryDateTime.getTime() + shiftConfig.hours * 60 * 60 * 1000
  );

  // Determinar horario del día de retiro calculado
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

  // Excepción: para entregas a las 1PM o 2PM, permitir retiro hasta las 8PM
  const isExceptionDelivery =
    deliveryTime === '13:00' || deliveryTime === '14:00';
  const sameDay =
    format(pickupDateTime, 'yyyy-MM-dd') === format(deliveryDate, 'yyyy-MM-dd');

  // Verificar si el pickupTime está dentro del horario laboral
  const isWithinBusinessHours =
    !isBefore(pickupDateTime, openTime) && !isAfter(pickupDateTime, closeTime);

  if (!isWithinBusinessHours) {
    if (isExceptionDelivery && sameDay && isAfter(pickupDateTime, closeTime)) {
      // Para entregas a 1PM o 2PM, si excede 8PM, establecer a 8PM del mismo día
      pickupDateTime = setMinutes(setHours(deliveryDate, 20), 0);
    } else {
      // Si el día calculado es laboral y la hora es antes de apertura, establecer a apertura del mismo día
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

/**
 * Genera opciones de horario disponibles (cada 30 min)
 */
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

/**
 * Verifica si un día es laboral
 */
export function isWorkDay(date: Date): boolean {
  return BUSINESS_HOURS.workDays.includes(getDay(date));
}

/**
 * Formatea fecha y hora para mostrar
 */
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
