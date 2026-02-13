# Arquitectura Web-App - AquaGest

## Descripción General

La aplicación web es una PWA (Progressive Web App) construida con React + Vite que gestiona ventas de agua, alquiler de lavadoras y control de gastos. Utiliza Zustand para gestión de estado global y Supabase como backend.

## Stack Tecnológico

- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Gestión de Estado**: Zustand con persistencia
- **Base de Datos**: Supabase (PostgreSQL)
- **UI Components**: Radix UI + TailwindCSS
- **Routing**: Navegación basada en estado (sin react-router)
- **Iconos**: Lucide React
- **Testing**: Vitest + React Testing Library

## Estructura de Carpetas

```
apps/web-app/src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (Button, Card, etc)
│   ├── layout/         # Header, Footer, etc
│   ├── ventas/         # Componentes específicos de ventas
│   ├── alquileres/     # Componentes de alquileres
│   ├── egresos/        # Componentes de egresos
│   └── dashboard/      # Componentes del dashboard
├── pages/              # Páginas principales de la app
├── services/           # Lógica de negocio y servicios
├── store/              # Gestión de estado con Zustand
├── types/              # Definiciones de TypeScript
├── hooks/              # Custom hooks
├── utils/              # Utilidades y helpers
└── lib/                # Configuraciones de librerías
```

## Principios de Arquitectura

### 1. Separación de Responsabilidades (SRP)
- **Componentes**: Solo renderizado y manejo de eventos UI
- **Servicios**: Lógica de negocio pura (cálculos, filtros, transformaciones)
- **Store**: Gestión de estado y sincronización con Supabase
- **Hooks**: Lógica reutilizable de componentes

### 2. Gestión de Estado
- **Estado Global**: Zustand (`useAppStore`)
- **Estado Local**: `useState` en componentes
- **Persistencia**: LocalStorage para datos críticos
- **Sincronización**: Supabase para datos compartidos

### 3. Manejo de Datos
- **Optimistic Updates**: Actualizar UI inmediatamente, sincronizar después
- **Fallback Local**: Si Supabase falla, mantener datos en localStorage
- **Cache Invalidation**: Servicios de caché para datos por fecha

### 4. Patrones de Diseño
- **Service Layer**: Servicios puros sin efectos secundarios
- **Repository Pattern**: Store actúa como repositorio
- **Observer Pattern**: Zustand notifica cambios a componentes
- **Factory Pattern**: Funciones generadoras de IDs y timestamps

## Flujo de Datos

```
Usuario → Componente → Store Action → Supabase
                          ↓
                    Estado Local
                          ↓
                    Re-render Componente
```

### Ejemplo: Agregar Venta

1. Usuario completa formulario en `VentasPage`
2. Click en "Agregar Venta" → `store.addSale()`
3. Store genera ID temporal y actualiza estado local (optimistic)
4. Store intenta guardar en Supabase
5. Si éxito: actualiza con ID real de Supabase
6. Si fallo: mantiene datos locales, muestra error

## Tipos de Datos Principales

### Sale (Venta)
```typescript
interface Sale {
  id: string;
  dailyNumber: number;      // Número secuencial del día
  date: string;             // YYYY-MM-DD
  items: CartItem[];        // Productos vendidos
  paymentMethod: PaymentMethod;
  totalBs: number;
  totalUsd: number;
  exchangeRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### WasherRental (Alquiler)
```typescript
interface WasherRental {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  machineId: number;
  shift: string;
  deliveryTime: string;
  pickupTime: string;
  deliveryFee: number;
  totalUsd: number;
  paymentMethod: PaymentMethod;
  status: RentalStatus;
  isPaid: boolean;
  datePaid?: string;
  notes?: string;
}
```

### Expense (Egreso)
```typescript
interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;           // En Bolívares
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}
```

## Servicios Principales

### DashboardMetricsService
Calcula métricas financieras del día y mes:
- Ingresos totales (agua + alquileres + prepagados)
- Egresos totales
- Neto (ingresos - egresos)
- Totales por método de pago
- Transacciones del día

### DateService
Normalización y manejo de fechas:
- Convierte fechas a formato local YYYY-MM-DD
- Evita problemas de timezone
- Genera timestamps seguros

### SalesDataService
Caché de ventas por fecha:
- Reduce llamadas a Supabase
- Invalida caché cuando hay cambios
- Filtra ventas por rango de fechas

### RentalsDataService
Similar a SalesDataService pero para alquileres

### ExpensesDataService
Similar a SalesDataService pero para egresos

## Componentes Clave

### Header
Barra superior con título y acciones

### DateSelector
Selector de fecha con navegación día/mes/año

### KpiCard
Tarjeta de métrica con valor, título e ícono

### SalesChart
Gráfico de barras de ventas semanales

### ProductCard
Tarjeta de producto con precio y opciones

### RentalCard
Tarjeta de alquiler con estado y acciones

### ExpenseCard
Tarjeta de egreso con categoría y monto

## Páginas Principales

1. **DashboardPage**: Vista general con KPIs y métricas
2. **VentasPage**: Gestión de ventas de agua
3. **AlquilerPage**: Gestión de alquileres de lavadoras
4. **EgresosPage**: Registro de gastos
5. **ConfigPage**: Configuración de precios y tasa de cambio
6. **ClientesPage**: Gestión de clientes
7. **LavadorasPage**: Gestión de lavadoras
8. **PrepagadosPage**: Gestión de pedidos prepagados
9. **WaterMetricsPage**: Métricas detalladas de ventas de agua
10. **TransactionsSummaryPage**: Resumen de transacciones del día

## Integración con Supabase

### Configuración
```typescript
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Tablas Principales
- `sales`: Ventas de agua
- `washer_rentals`: Alquileres de lavadoras
- `expenses`: Egresos/gastos
- `customers`: Clientes
- `washing_machines`: Lavadoras disponibles
- `products`: Productos disponibles
- `prepaid_orders`: Pedidos prepagados
- `liter_pricing`: Configuración de precios por litro
- `exchange_rates`: Historial de tasas de cambio
- `payment_balance_transactions`: Transferencias entre métodos de pago

### Políticas RLS
Todas las tablas tienen políticas permisivas para desarrollo:
```sql
CREATE POLICY "Allow all operations" 
ON table_name FOR ALL 
USING (true) 
WITH CHECK (true);
```

## Manejo de Errores

### Estrategia de Fallback
1. Intentar operación en Supabase
2. Si falla, actualizar solo estado local
3. Mostrar toast de error al usuario
4. Mantener datos en localStorage como backup

### Logging
```typescript
console.error('Failed to add sale', err);
toast.error('Error al agregar venta');
```

## Performance

### Optimizaciones
- Lazy loading de componentes pesados
- Memoización con `useMemo` y `useCallback`
- Virtualización de listas largas (si aplica)
- Debounce en búsquedas
- Cache de datos por fecha

### Bundle Size
- Code splitting por página
- Tree shaking automático con Vite
- Importaciones específicas de librerías

## Testing

### Estrategia
- Unit tests para servicios puros
- Component tests para UI
- Integration tests para flujos críticos
- Mock de Supabase y store en tests

### Ejemplo
```typescript
describe('DashboardMetricsService', () => {
  it('should calculate daily metrics correctly', () => {
    const result = calculateDashboardMetrics(input);
    expect(result.day.totalIncomeBs).toBe(1000);
  });
});
```

## Deployment

### Build
```bash
npx nx build web-app
```

### Output
```
dist/apps/web-app/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── manifest.json
```

### Variables de Entorno
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Mejores Prácticas

1. **Componentes**: Mantener pequeños y enfocados
2. **Servicios**: Funciones puras sin side effects
3. **Store**: Acciones descriptivas y atómicas
4. **Tipos**: Siempre tipar todo con TypeScript
5. **Estilos**: Usar TailwindCSS, evitar CSS custom
6. **Fechas**: Siempre usar DateService para normalizar
7. **IDs**: Usar UUIDs de Supabase cuando sea posible
8. **Errores**: Siempre manejar casos de error
9. **Loading**: Mostrar estados de carga al usuario
10. **Accesibilidad**: Usar componentes de Radix UI

## Próximos Pasos

- [ ] Implementar autenticación con Supabase Auth
- [ ] Agregar sincronización en tiempo real
- [ ] Implementar modo offline completo
- [ ] Agregar exportación de reportes (PDF/Excel)
- [ ] Implementar notificaciones push
- [ ] Agregar gráficos avanzados con Recharts
- [ ] Implementar búsqueda global
- [ ] Agregar filtros avanzados en todas las vistas
