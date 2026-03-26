# water-sale-dashboard-metrics.e2e.spec.ts

Test E2E de Playwright para validar la propagación de ventas de agua al dashboard y métricas.

## Descripción

Este test verifica que las ventas de agua se propagan correctamente a través de la aplicación:

- Dashboard (tarjetas de métodos de pago)
- Lista de Transacciones
- Detalle de método de pago

## Tests Implementados

### 1. Test Parametrizado: Propagación por Método de Pago

**Validaciones:**

- ✅ Crea una venta de agua con cada método de pago

  - `@efectivo` → efectivo
  - `@pago_movil` → pago_movil
  - `@pago_venta` → punto_venta
  - `@divisa` → divisa

- ✅ Verifica que la venta se persiste en Supabase
- ✅ Verifica que la tarjeta del método de pago muestra el monto actualizado
- ✅ Verifica que la transacción aparece en "Transacciones"
- ✅ Verifica el contenido de la transacción (método de pago, tipo de venta)
- ✅ Verifica que el detalle del método de pago muestra la venta

### 2. Test: Dashboard con 4 Ventas

**Validaciones:**

- ✅ Crea 4 ventas con montos aleatorios (2000-4000 bs)
- ✅ Una venta por cada método de pago
- ✅ Verifica que "Transacciones" muestra 4
- ✅ Verifica que cada tarjeta de método de pago es visible
- ✅ Verifica que cada tarjeta muestra el monto correcto
- ✅ **Valida que la suma de todos los totales = suma de los precios establecidos**

## Estrategia de Datos

- **Marcador de ejecución:** `E2E_WATER_SALE_<timestamp>_<random>`
- **Propósito:** Identificar ventas de forma determinista en Supabase
- **Assertions:** Usan `toBeGreaterThanOrEqual` para tolerar writes concurrentes

## Comandos de Ejecución

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts
```

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts --debug
```

## Casos Borde Cubiertos

- ✅ Venta con precio personalizado
- ✅ Venta con notas para trazabilidad
- ✅ Múltiples ventas en sesión
- ✅ Diferentes métodos de pago
- ✅ Validación de totales agregados
- ✅ Propagación de datos a Supabase

## Casos Borde NO Cubiertos

- 💩 Breakpoints de precio (se valida en otro test)
- 🔄 Propinas en ventas (se valida en otro test)
- 🔄 Pagos mixtos (se valida en otro test)
- 🔄 Edición de venta (se valida en otro test)
- 🔄 Eliminación de venta (se valida en otro test)

**Última actualización:** 2026-03-23
