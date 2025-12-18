import { RentalShiftConfig, RentalShift, BUSINESS_HOURS } from '@/types';
import { format, addDays, setHours, setMinutes, parse, isAfter, isBefore, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcula la hora y fecha de retiro de una lavadora
 * respetando el horario comercial (Lunes-Sábado 9AM-8PM)
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
  let pickupDateTime = new Date(deliveryDateTime.getTime() + shiftConfig.hours * 60 * 60 * 1000);
  
  // Verificar si excede el horario de cierre
  const closeTime = setMinutes(setHours(new Date(pickupDateTime), BUSINESS_HOURS.closeHour), 0);
  
  if (isAfter(pickupDateTime, closeTime)) {
    // Calcular horas restantes
    const hoursRemaining = (pickupDateTime.getTime() - closeTime.getTime()) / (1000 * 60 * 60);
    
    // Mover al siguiente día laboral
    let nextDay = addDays(new Date(deliveryDate), 1);
    
    // Buscar el siguiente día laboral (evitar domingos)
    while (!BUSINESS_HOURS.workDays.includes(getDay(nextDay))) {
      nextDay = addDays(nextDay, 1);
    }
    
    // Establecer hora de apertura + horas restantes
    pickupDateTime = setMinutes(
      setHours(nextDay, BUSINESS_HOURS.openHour + Math.floor(hoursRemaining)),
      Math.round((hoursRemaining % 1) * 60)
    );
    
    // Si aún excede el horario de cierre del siguiente día, establecer al cierre
    const nextDayClose = setMinutes(setHours(nextDay, BUSINESS_HOURS.closeHour), 0);
    if (isAfter(pickupDateTime, nextDayClose)) {
      pickupDateTime = nextDayClose;
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
  for (let hour = BUSINESS_HOURS.openHour; hour < BUSINESS_HOURS.closeHour; hour++) {
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
export function formatPickupInfo(pickupDate: string, pickupTime: string, deliveryDate: string): string {
  const isSameDay = pickupDate === deliveryDate;
  
  if (isSameDay) {
    return `Hoy a las ${pickupTime}`;
  }
  
  const date = parse(pickupDate, 'yyyy-MM-dd', new Date());
  return `${format(date, "EEEE d 'de' MMMM", { locale: es })} a las ${pickupTime}`;
}
