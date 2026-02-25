# Flujo de Egresos - AquaGest

## Descripción General

El módulo de egresos registra y categoriza todos los gastos del negocio, permitiendo control financiero y análisis de costos operativos.

## Componentes Principales

### EgresosPage
Página principal con formulario de registro y lista de egresos del día/mes.

### ExpenseCard
Tarjeta de egreso con categoría, monto, método de pago y acciones.

### ExpenseForm
Formulario para crear/editar egreso con validaciones.

## Flujo de Registro de Egreso

```
Usuario completa formulario
    ↓
Ingresa descripción del gasto
    ↓
Ingresa monto en Bolívares
    ↓
Selecciona categoría
    ↓
Selecciona método de pago
    ↓
Agrega notas opcionales
    ↓
Click en "Registrar Egreso"
    ↓
store.addExpense(expenseData)
    ↓
Valida campos requeridos
    ↓
Guarda en Supabase
    ↓
Actualiza estado local
    ↓
Invalida caché de fecha
    ↓
Muestra confirmación
```

## Estructura de Datos

### Expense
- id: UUID
- date: YYYY-MM-DD
- description: string (descripción del gasto)
- amount: número en Bolívares
- category: ExpenseCategory
- paymentMethod: PaymentMethod
- notes: string opcional
- createdAt: timestamp

## Categorías de Egresos

```typescript
type ExpenseCategory = 
  | 'operativo'      // Gastos operativos generales
  | 'insumos'        // Compra de productos/materiales
  | 'servicios'      // Servicios (luz, agua, internet)
  | 'mantenimiento'  // Mantenimiento de equipos
  | 'personal'       // Nómina y pagos a personal
  | 'otros';         // Otros gastos
```

## Validaciones

- Descripción requerida (mínimo 3 caracteres)
- Monto mayor a 0
- Categoría válida
- Método de pago válido
- Fecha no puede ser futura

## Filtros y Búsqueda

- Filtrar por fecha (día/mes/año)
- Filtrar por categoría
- Filtrar por método de pago
- Buscar por descripción
- Ordenar por fecha o monto

## Cálculos

### Total de Egresos del Día
```typescript
const dailyExpenses = expenses
  .filter(e => e.date === selectedDate)
  .reduce((sum, e) => sum + e.amount, 0);
```

### Total por Categoría
```typescript
const byCategory = expenses
  .filter(e => e.date === selectedDate)
  .reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
```

### Total por Método de Pago
```typescript
const byPaymentMethod = expenses
  .filter(e => e.date === selectedDate)
  .reduce((acc, e) => {
    acc[e.paymentMethod] = (acc[e.paymentMethod] || 0) + e.amount;
    return acc;
  }, {});
```

## Integración con Dashboard

Los egresos se restan de los ingresos para calcular:
- Neto del día
- Neto del mes
- Balance por método de pago

## Reportes

- Resumen diario de gastos
- Resumen mensual por categoría
- Comparativa mes a mes
- Gráficos de distribución de gastos
