# Flujo de Dashboard y Métricas - AquaGest

## Descripción General

El dashboard proporciona una vista consolidada de métricas financieras, KPIs y análisis del negocio en tiempo real.

## Componentes Principales

- **DashboardPage**: Página principal con KPIs y gráficos
- **KpiCard**: Tarjeta de métrica con valor e ícono
- **SalesChart**: Gráfico de barras de ventas semanales
- **RecentSales**: Lista de ventas recientes

## Métricas Calculadas

### Métricas del Día
- Ingresos Totales (Ventas + Alquileres + Prepagados)
- Egresos del día
- Neto (Ingresos - Egresos)
- Transacciones totales
- Desglose por método de pago

### Métricas del Mes (MTD)
- Acumulado desde día 1 hasta fecha seleccionada
- Neto mensual
- Promedio diario

## DashboardMetricsService

Servicio que calcula todas las métricas financieras.

### Input
- selectedDate
- exchangeRate
- sales, rentals, expenses
- prepaidOrders
- paymentBalanceTransactions

### Output
```typescript
{
  day: ScopeMetrics,
  mtd: ScopeMetrics
}
```

## Cálculo de Métricas

1. Filtrar datos por rango de fechas
2. Sumar ingresos (ventas + alquileres + prepagados)
3. Sumar egresos
4. Calcular neto
5. Desglosar por método de pago
6. Aplicar transferencias de balance

## Gráfico Semanal

Muestra ventas de los últimos 7 días con barras por día de la semana.

## Selector de Fecha

- Navegación día/mes anterior/siguiente
- Calendario para selección directa
- Botón "Hoy"

## Conversión de Moneda

- Bs a USD: dividir por tasa
- USD a Bs: multiplicar por tasa

## KPIs Principales

1. Ingresos del Día
2. Acumulado Mes
3. Neto Mes
4. Egresos Hoy
5. Neto Hoy
6. Transacciones

## Resumen por Método de Pago

Muestra balance actual de cada método considerando:
- Ingresos recibidos
- Egresos pagados
- Transferencias entre métodos
