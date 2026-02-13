# Gestión de Estado - useAppStore (Zustand)

## Descripción General

La aplicación usa Zustand para gestión de estado global con persistencia en localStorage y sincronización con Supabase.

## Ubicación

`apps/web-app/src/store/useAppStore.ts`

## Estructura del Store

### Estado Principal
```typescript
interface AppState {
  // Datos
  sales: Sale[];
  rentals: WasherRental[];
  expenses: Expense[];
  customers: Customer[];
  washingMachines: WashingMachine[];
  products: Product[];
  prepaidOrders: PrepaidOrder[];
  paymentBalanceTransactions: PaymentBalanceTransaction[];
  
  // Configuración
  config: {
    exchangeRate: number;
    literPricing: LiterPricing[];
    lastUpdated: string;
  };
  
  // UI State
  cart: CartItem[];
  selectedDate: string;
  
  // Actions
  addSale: (paymentMethod, notes) => Promise<void>;
  updateSale: (id, updates) => Promise<void>;
  deleteSale: (id) => Promise<void>;
  // ... más acciones
}
```

## Persistencia

### Configuración
```typescript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'aqua-gest-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      sales: state.sales,
      rentals: state.rentals,
      expenses: state.expenses,
      config: state.config,
      cart: state.cart,
      selectedDate: state.selectedDate
    })
  }
)
```

### Datos Persistidos
- Ventas, alquileres, egresos
- Configuración (tasa, precios)
- Carrito de compras
- Fecha seleccionada

### Datos NO Persistidos
- Clientes (se cargan de Supabase)
- Lavadoras (se cargan de Supabase)
- Productos (se cargan de Supabase)

## Patrón de Acciones

### Estructura Típica
```typescript
addItem: async (item) => {
  try {
    // 1. Actualizar estado local (optimistic)
    set(state => ({
      items: [...state.items, item]
    }));
    
    // 2. Sincronizar con Supabase
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // 3. Actualizar con datos reales de Supabase
    set(state => ({
      items: state.items.map(i => 
        i.id === item.id ? data : i
      )
    }));
    
    // 4. Invalidar caché
    dataService.invalidateCache(item.date);
    
  } catch (err) {
    console.error('Failed to add item', err);
    // Mantener datos locales como fallback
  }
}
```

## Acciones Principales

### Ventas
- `addSale(paymentMethod, notes)`
- `updateSale(id, updates)`
- `deleteSale(id)`
- `getSalesByDate(date)`
- `addToCart(product, quantity, liters)`
- `removeFromCart(itemId)`
- `clearCart()`

### Alquileres
- `addRental(rental)`
- `updateRental(id, updates)`
- `deleteRental(id)`
- `getRentalsByDate(date)`

### Egresos
- `addExpense(expense)`
- `updateExpense(id, updates)`
- `deleteExpense(id)`
- `getExpensesByDate(date)`

### Clientes
- `addCustomer(customer)`
- `updateCustomer(id, updates)`
- `deleteCustomer(id)`
- `loadCustomers()`

### Configuración
- `setExchangeRate(rate)`
- `setLiterPricing(pricing)`
- `loadConfig()`

### Carga de Datos
- `loadDataForDateRange(start, end)`
- `loadInitialData()`

## Sincronización con Supabase

### Estrategia Optimistic Updates
1. Actualizar UI inmediatamente
2. Intentar guardar en Supabase
3. Si falla, mantener datos locales
4. Mostrar error al usuario

### Manejo de Errores
```typescript
try {
  await supabase.from('table').insert(data);
} catch (err) {
  console.error('Supabase error', err);
  toast.error('Error al guardar');
  // Datos persisten en localStorage
}
```

## Caché e Invalidación

### Servicios de Caché
- `SalesDataService`
- `RentalsDataService`
- `ExpensesDataService`

### Invalidación
Cuando se modifica un dato, se invalida el caché de esa fecha para forzar recarga desde Supabase en próxima consulta.

## Selectores

### Uso en Componentes
```typescript
const { sales, addSale, cart } = useAppStore();
```

### Selectores Específicos
```typescript
const sales = useAppStore(state => state.sales);
const addSale = useAppStore(state => state.addSale);
```

## Mejores Prácticas

1. Siempre usar acciones del store, nunca mutar estado directamente
2. Manejar errores de Supabase gracefully
3. Invalidar caché después de cambios
4. Usar optimistic updates para mejor UX
5. Persistir solo datos necesarios
6. Cargar datos por rango de fechas, no todo
7. Usar selectores específicos para evitar re-renders
