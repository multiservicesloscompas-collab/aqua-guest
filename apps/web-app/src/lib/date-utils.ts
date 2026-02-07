/**
 * Utilidades para manejo de fechas
 * Sigue Single Responsibility Principle - solo maneja transformaciones de fechas
 */

/**
 * Genera un timestamp ISO 8601 seguro
 * Evita problemas de zona horaria usando constructores explícitos
 */
export function getSafeTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

/**
 * Convierte timestamp de Supabase (snake_case) a formato camelCase
 * Maneja casos donde el timestamp puede venir en snake_case o camelCase
 */
export function normalizeTimestamp(
  supabaseTimestamp: string | undefined,
  localTimestamp: string
): string {
  // Si Supabase no devuelve el timestamp, usar el local seguro
  if (!supabaseTimestamp) {
    return localTimestamp;
  }

  // Validar que el timestamp sea un string ISO válido
  const date = new Date(supabaseTimestamp);
  if (isNaN(date.getTime())) {
    // Si es inválido, usar el local seguro
    return localTimestamp;
  }

  // Si es válido, usar el de Supabase para consistencia
  return supabaseTimestamp;
}

/**
 * Obtiene el timestamp en milisegundos para ordenamiento seguro
 * Si el timestamp es inválido, devuelve 0 para evitar NaN
 */
export function getSafeTimestampForSorting(timestamp: string): number {
  if (!timestamp) return 0;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

/**
 * Compara dos timestamps para ordenamiento
 * Retorna positivo si b > a, negativo si a > b, 0 si iguales
 */
export function compareTimestamps(a: string, b: string): number {
  return getSafeTimestampForSorting(b) - getSafeTimestampForSorting(a);
}
