# Flujo de Ventas - AquaGest

## Descripción General

El módulo de ventas gestiona la venta de agua embotellada con diferentes presentaciones (botellones, botellas, vasos). Permite configurar precios dinámicos por litros y registrar ventas con múltiples productos.

## Componentes Principales

### VentasPage
**Ubicación**: `apps/web-app/src/pages/VentasPage.tsx`

Página principal de ventas que integra:
- Carrito de compras
- Selector de productos
- Selector de método de pago
- Lista de ventas del día
- Resumen de totales

### ProductCard
**Ubicación**: `apps/web-app/src/components/ventas/ProductCard.tsx`

Tarjeta de producto con:
- Nombre e ícono del producto
- Precio base
- Input de cantidad
- Input de litros (si aplica)
- Cálculo automático de precio según litros

### CartItem
**Ubicación**: `apps/web-app/src/components/ventas/CartItem.tsx`

Item del carrito con:
- Información del producto
- Cantidad y litros
- Subtotal
- Botón para eliminar

### SalesList
**Ubicación**: `apps/web-app/src/components/ventas/SalesList.tsx`

Lista de ventas del día con:
- Número de venta diario
- Productos vendidos
- Método de pago
- Total en Bs y USD
- Acciones (editar, eliminar)

## Flujo de Datos

### 1. Inicialización

```typescript
// Al cargar la página
useEffect(() => {
  // Cargar productos desde Supabase
  store.loadProducts();
  
  // Cargar configuración de precios por litro
  store.loadLiterPricing();
  
  // Cargar ventas del día seleccionado
  store.getSalesByDate(selectedDate);
}, [selectedDate]);
```

### 2. Agregar Producto al Carrito

```
Usuario selecciona producto
    ↓
Ingresa cantidad y litros (si aplica)
    ↓
Click en "Agregar"
    ↓
store.addToCart(product, quantity, liters)
    ↓
Calcula precio según litros
    ↓
Actualiza estado del carrito
    ↓
Re-render de CartItem
```

**Cálculo de Precio por Litros**:
```typescript
// Ejemplo: Configuración de precios
literPricing = [
  { breakpoint: 0, price: 1.50 },   // 0-19 litros: Bs 1.50/litro
  { breakpoint: 20, price: 1.30 },  // 20-49 litros: Bs 1.30/litro
  { breakpoint: 50, price: 1.00 },  // 50+ litros: Bs 1.00/litro
];

// Si usuario compra 25 litros
const pricePerLiter = 1.30; // Segundo breakpoint
const totalPrice = 25 * 1.30 = 32.50 Bs
```

### 3. Completar Venta

```
Usuario revisa carrito
    ↓
Selecciona método de pago
    ↓
Agrega notas (opcional)
    ↓
Click en "Completar Venta"
    ↓
store.addSale(paymentMethod, notes)
    ↓
Genera ID temporal
    ↓
Calcula número diario (dailyNumber)
    ↓
Actualiza estado local (optimistic)
    ↓
Intenta guardar en Supabase
    ↓
Si éxito: actualiza con ID real
    ↓
Si fallo: mantiene local, muestra error
    ↓
Limpia carrito
    ↓
Muestra toast de confirmación
```

### 4. Editar Venta

```
Usuario click en "Editar" en SaleCard
    ↓
store.updateSale(id, updates)
    ↓
Actualiza estado local
    ↓
Sincroniza con Supabase
    ↓
Invalida caché de fecha
    ↓
Re-render de lista
```

### 5. Eliminar Venta

```
Usuario click en "Eliminar"
    ↓
Muestra diálogo de confirmación
    ↓
Usuario confirma
    ↓
store.deleteSale(id)
    ↓
Elimina de estado local
    ↓
Elimina de Supabase
    ↓
Invalida caché de fecha
    ↓
Re-render de lista
```

## Estructura de Datos

### Sale (Venta)
```typescript
interface Sale {
  id: string;                    // UUID de Supabase
  dailyNumber: number;           // Número secuencial del día (1, 2, 3...)
  date: string;                  // YYYY-MM-DD
  items: CartItem[];             // Array de productos vendidos
  paymentMethod: PaymentMethod;  // 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa'
  totalBs: number;               // Total en Bolívares
  totalUsd: number;              // Total en Dólares
  exchangeRate: number;          // Tasa de cambio al momento de la venta
  notes?: string;                // Notas adicionales
  createdAt: string;             // Timestamp ISO
  updatedAt: string;             // Timestamp ISO
}
```

### CartItem
```typescript
interface CartItem {
  id: string;           // ID temporal del item
  productId: string;    // ID del producto
  productName: string;  // Nombre del producto
  quantity: number;     // Cantidad de unidades
  liters?: number;      // Litros (solo si el producto lo requiere)
  unitPrice: number;    // Precio por unidad en Bs
  subtotal: number;     // quantity * unitPrice
}
```

### Product
```typescript
interface Product {
  id: string;
  name: string;
  defaultPrice: number;      // Precio base en Bs
  requiresLiters: boolean;   // Si requiere input de litros
  minLiters?: number;        // Mínimo de litros permitido
  maxLiters?: number;        // Máximo de litros permitido
  icon?: string;             // Nombre del ícono de Lucide
}
```

## Tabla en Supabase

### sales
```sql
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  items JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  total_bs NUMERIC NOT NULL,
  total_usd NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  notes TEXT,
  temp_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

## Servicios Utilizados

### SalesDataService
**Ubicación**: `apps/web-app/src/services/SalesDataService.ts`

Gestiona caché de ventas por fecha:
```typescript
class SalesDataService {
  private cache: Map<string, Sale[]>;
  
  // Invalida caché cuando hay cambios
  invalidateCache(date: string): void;
  
  // Obtiene ventas de caché o Supabase
  async getSalesByDate(date: string): Promise<Sale[]>;
}
```

### SalesFilterService
**Ubicación**: `apps/web-app/src/services/SalesFilterService.ts`

Filtra ventas por criterios:
```typescript
class SalesFilterService {
  // Filtra ventas por fecha
  filterSales(sales: Sale[], date: string): Sale[];
  
  // Filtra por rango de fechas
  filterByDateRange(sales: Sale[], start: string, end: string): Sale[];
}
```

### DateService
**Ubicación**: `apps/web-app/src/services/DateService.ts`

Normaliza fechas para evitar problemas de timezone:
```typescript
class DateService {
  // Convierte Date a YYYY-MM-DD local
  normalizeSaleDate(date: string | Date): string;
  
  // Genera timestamp seguro
  getSafeTimestamp(): string;
}
```

## Store Actions

### addSale
```typescript
addSale: async (paymentMethod: PaymentMethod, notes?: string) => {
  // 1. Calcular totales del carrito
  const totalBs = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUsd = totalBs / exchangeRate;
  
  // 2. Calcular número diario
  const salesOfDay = sales.filter(s => s.date === selectedDate);
  const dailyNumber = salesOfDay.length + 1;
  
  // 3. Crear objeto de venta
  const newSale = {
    daily_number: dailyNumber,
    date: selectedDate,
    items: cart,
    payment_method: paymentMethod,
    total_bs: totalBs,
    total_usd: totalUsd,
    exchange_rate: exchangeRate,
    notes
  };
  
  // 4. Guardar en Supabase
  const { data, error } = await supabase
    .from('sales')
    .insert(newSale)
    .select('*')
    .single();
  
  // 5. Actualizar estado local
  set(state => ({
    sales: [...state.sales, transformedSale],
    cart: [] // Limpiar carrito
  }));
  
  // 6. Invalidar caché
  salesDataService.invalidateCache(selectedDate);
}
```

### updateSale
```typescript
updateSale: async (id: string, updates: Partial<Sale>) => {
  // 1. Actualizar en Supabase
  const { error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', id);
  
  // 2. Actualizar estado local
  set(state => ({
    sales: state.sales.map(s => 
      s.id === id ? { ...s, ...updates } : s
    )
  }));
  
  // 3. Invalidar caché
  salesDataService.invalidateCache(updates.date || sale.date);
}
```

### deleteSale
```typescript
deleteSale: async (id: string) => {
  const sale = sales.find(s => s.id === id);
  
  // 1. Eliminar de Supabase
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  // 2. Eliminar de estado local
  set(state => ({
    sales: state.sales.filter(s => s.id !== id)
  }));
  
  // 3. Invalidar caché
  if (sale) {
    salesDataService.invalidateCache(sale.date);
  }
}
```

## Validaciones

### Validación de Carrito
```typescript
// No permitir venta sin productos
if (cart.length === 0) {
  toast.error('Agrega productos al carrito');
  return;
}

// Validar cantidad mínima
if (item.quantity < 1) {
  toast.error('La cantidad debe ser mayor a 0');
  return;
}

// Validar litros si el producto lo requiere
if (product.requiresLiters && !liters) {
  toast.error('Debes especificar los litros');
  return;
}

// Validar rango de litros
if (liters < product.minLiters || liters > product.maxLiters) {
  toast.error(`Los litros deben estar entre ${product.minLiters} y ${product.maxLiters}`);
  return;
}
```

### Validación de Método de Pago
```typescript
// Método de pago requerido
if (!paymentMethod) {
  toast.error('Selecciona un método de pago');
  return;
}

// Validar método válido
const validMethods = ['efectivo', 'pago_movil', 'punto_venta', 'divisa'];
if (!validMethods.includes(paymentMethod)) {
  toast.error('Método de pago inválido');
  return;
}
```

## Cálculos

### Precio por Litros
```typescript
function calculatePricePerLiter(liters: number, pricing: LiterPricing[]): number {
  // Ordenar por breakpoint descendente
  const sorted = [...pricing].sort((a, b) => b.breakpoint - a.breakpoint);
  
  // Encontrar el precio aplicable
  for (const tier of sorted) {
    if (liters >= tier.breakpoint) {
      return tier.price;
    }
  }
  
  // Si no hay match, usar el precio más bajo
  return sorted[sorted.length - 1].price;
}
```

### Total del Carrito
```typescript
function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}
```

### Conversión a USD
```typescript
function convertToUsd(amountBs: number, exchangeRate: number): number {
  return amountBs / exchangeRate;
}
```

## Manejo de Errores

### Error al Guardar en Supabase
```typescript
try {
  await supabase.from('sales').insert(newSale);
} catch (err) {
  console.error('Failed to add sale', err);
  toast.error('Error al guardar la venta');
  // Mantener datos en estado local como fallback
}
```

### Error de Red
```typescript
// Si Supabase no responde, mantener datos locales
if (error?.message.includes('network')) {
  toast.warning('Sin conexión. Venta guardada localmente');
  // Los datos persisten en localStorage vía Zustand
}
```

## UI/UX

### Estados de Carga
```typescript
const [loading, setLoading] = useState(false);

const handleAddSale = async () => {
  setLoading(true);
  try {
    await store.addSale(paymentMethod, notes);
    toast.success('Venta agregada exitosamente');
  } finally {
    setLoading(false);
  }
};
```

### Feedback Visual
- **Toast de éxito**: "Venta agregada exitosamente"
- **Toast de error**: "Error al agregar venta"
- **Loading spinner**: Durante guardado
- **Disabled buttons**: Mientras está guardando

### Responsive Design
- **Mobile**: Vista de lista vertical
- **Desktop**: Grid de 2-3 columnas
- **Carrito**: Siempre visible en la parte superior

## Optimizaciones

### Memoización
```typescript
// Memoizar cálculo de total
const cartTotal = useMemo(() => 
  calculateCartTotal(cart), 
  [cart]
);

// Memoizar filtrado de ventas
const todaySales = useMemo(() => 
  sales.filter(s => s.date === selectedDate),
  [sales, selectedDate]
);
```

### Debounce en Inputs
```typescript
// Evitar recalcular precio en cada tecla
const debouncedLiters = useDebounce(liters, 300);

useEffect(() => {
  if (debouncedLiters) {
    calculatePrice(debouncedLiters);
  }
}, [debouncedLiters]);
```

## Testing

### Unit Tests
```typescript
describe('calculatePricePerLiter', () => {
  it('should return correct price for 25 liters', () => {
    const pricing = [
      { breakpoint: 0, price: 1.50 },
      { breakpoint: 20, price: 1.30 },
      { breakpoint: 50, price: 1.00 },
    ];
    expect(calculatePricePerLiter(25, pricing)).toBe(1.30);
  });
});
```

### Component Tests
```typescript
describe('VentasPage', () => {
  it('should add product to cart', async () => {
    render(<VentasPage />);
    
    const addButton = screen.getByText('Agregar');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Botellón 20L')).toBeInTheDocument();
  });
});
```

## Mejores Prácticas

1. **Siempre validar inputs** antes de agregar al carrito
2. **Usar DateService** para normalizar fechas
3. **Invalidar caché** después de cada cambio
4. **Mostrar feedback** al usuario en cada acción
5. **Manejar errores** de red gracefully
6. **Optimistic updates** para mejor UX
7. **Persistir carrito** en localStorage
8. **Calcular dailyNumber** correctamente por fecha
9. **Usar tipos estrictos** de TypeScript
10. **Testear cálculos** de precios exhaustivamente
