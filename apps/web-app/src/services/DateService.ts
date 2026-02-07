/**
 * Servicio de gestión de fechas - SRP: Single Responsibility Principle
 * Responsabilidad única: manejar operaciones de fechas y validaciones
 */

export interface IDateService {
  getCurrentDate(): string;
  normalizeSaleDate(selectedDate: string): string;
  isSameDate(date1: string, date2: string): boolean;
}

export class DateService implements IDateService {
  getCurrentDate(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  normalizeSaleDate(selectedDate: string): string {
    // Siempre usa la fecha seleccionada para mantener consistencia
    // Esto resuelve el problema de renderizado
    return selectedDate || this.getCurrentDate();
  }

  isSameDate(date1: string, date2: string): boolean {
    return date1 === date2;
  }
}

// Singleton para inyección de dependencias - DIP: Dependency Inversion Principle
export const dateService = new DateService();
