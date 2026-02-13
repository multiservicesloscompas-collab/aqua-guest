# Servicios y Utilidades - AquaGest

## Servicios Principales

### DashboardMetricsService
**Ubicación**: `apps/web-app/src/services/DashboardMetricsService.ts`

Calcula métricas financieras del día y mes.

**Funciones**:
- `calculateDashboardMetrics(input)`: Calcula todas las métricas
- `getMonthToDateRange(date)`: Obtiene rango del mes
- `filterByDateRange(items, range, getDate)`: Filtra por rango

**Características**:
- Funciones puras sin side effects
- Inmutabilidad de datos
- Testeable fácilmente

### DateService
**Ubicación**: `apps/web-app/src/services/DateService.ts`

Maneja normalización de fechas y timestamps.

**Funciones**:
- `normalizeSaleDate(date)`: Convierte a YYYY-MM-DD local
- `getSafeTimestamp()`: Genera timestamp ISO seguro
- `compareTimestamps(a, b)`: Compara dos timestamps

**Problema que resuelve**:
Evita problemas de timezone al trabajar con fechas en formato string.

### SalesDataService
**Ubicación**: `apps/web-app/src/services/SalesDataService.ts`

Gestiona caché de ventas por fecha.

**Funciones**:
- `invalidateCache(date)`: Invalida caché de una fecha
- `getSalesByDate(date)`: Obtiene ventas (caché o Supabase)

**Patrón**:
```typescript
class SalesDataService {
  private cache = new Map<string, Sale[]>();
  
  invalidateCache(date: string) {
    this.cache.delete(date);
  }
}
```

### RentalsDataService
Similar a SalesDataService pero para alquileres.

### ExpensesDataService
Similar a SalesDataService pero para egresos.

### SalesFilterService
**Ubicación**: `apps/web-app/src/services/SalesFilterService.ts`

Filtra ventas por criterios.

**Funciones**:
- `filterSales(sales, date)`: Filtra por fecha exacta
- `filterByDateRange(sales, start, end)`: Filtra por rango

## Utilidades

### generateId
**Ubicación**: `apps/web-app/src/utils/`

Genera IDs únicos temporales.

```typescript
function generateId(): string {
  return `temp_${Date.now()}_${Math.random()}`;
}
```

### formatCurrency
Formatea números como moneda.

```typescript
function formatCurrency(amount: number, currency: 'Bs' | 'USD'): string {
  return `${currency} ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
```

### calculatePricePerLiter
Calcula precio según breakpoints de litros.

```typescript
function calculatePricePerLiter(
  liters: number,
  pricing: LiterPricing[]
): number {
  const sorted = [...pricing].sort((a, b) => b.breakpoint - a.breakpoint);
  
  for (const tier of sorted) {
    if (liters >= tier.breakpoint) {
      return tier.price;
    }
  }
  
  return sorted[sorted.length - 1].price;
}
```

## Hooks Personalizados

### useMobile
**Ubicación**: `apps/web-app/src/hooks/useMobile.ts`

Detecta si es dispositivo móvil.

```typescript
function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}
```

### useDebounce
Retrasa ejecución de función.

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
```

## Configuración de Librerías

### Supabase Client
**Ubicación**: `apps/web-app/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### TailwindCSS
**Ubicación**: `apps/web-app/tailwind.config.js`

Configuración de tema, colores y plugins.

### Radix UI
Componentes base accesibles:
- Dialog
- Select
- Popover
- Toast (Sonner)

## Patrones de Diseño

### Service Layer Pattern
Servicios puros sin efectos secundarios para lógica de negocio.

### Repository Pattern
Store actúa como repositorio de datos.

### Observer Pattern
Zustand notifica cambios a componentes suscritos.

### Factory Pattern
Funciones generadoras de IDs y timestamps.

## Principios SOLID

### Single Responsibility
Cada servicio tiene una responsabilidad única.

### Open/Closed
Servicios abiertos a extensión, cerrados a modificación.

### Dependency Inversion
Componentes dependen de abstracciones (interfaces), no implementaciones.

## Testing

### Servicios Puros
```typescript
describe('DashboardMetricsService', () => {
  it('should calculate metrics correctly', () => {
    const result = calculateDashboardMetrics(mockInput);
    expect(result.day.totalIncomeBs).toBe(1000);
  });
});
```

### Hooks
```typescript
describe('useMobile', () => {
  it('should return true on mobile', () => {
    window.innerWidth = 375;
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(true);
  });
});
```

## Mejores Prácticas

1. Servicios sin side effects
2. Funciones puras cuando sea posible
3. Inmutabilidad de datos
4. Tipado estricto con TypeScript
5. Tests unitarios para lógica crítica
6. Documentar funciones complejas
7. Usar constantes para valores mágicos
8. Validar inputs en servicios públicos
