# water-sales-tips-matrix.e2e.spec.ts

Test E2E de Playwright para validar la matriz completa de ventas de agua con propinas y su propagación end-to-end.

## Descripción

Este test implementa una matriz de escenarios que combina diferentes:

- Métodos de pago (efectivo, pago_movil, punto_venta, divisa)
- Estados de propina (none, pending, paid)
- Rangos de precio (80 - 2000 BS)

Valida la propagación completa de datos a través de:

- Dashboard (tarjetas de métodos de pago)
- Módulo de Propinas
- Módulo de Egresos
- Transacciones

## Tests Implementados

### 1. Test: Matriz de Propagación End-to-End

**Validaciones:**

- ✅ Genera escenarios parametrizados con combinación de métodos de pago y estados de propina
- ✅ Crea ventas de agua con precios aleatorios (80-2000 BS)
- ✅ Valida que las ventas se persisten en Supabase
- ✅ Valida que las propinas se crean correctamente (pending o none)
- ✅ Paga las propinas pendientes a través del módulo de Propinas
- ✅ Verifica que el Dashboard muestra los deltas correctos
- ✅ Verifica el Módulo de Propinas con el ledger esperado
- ✅ Verifica el Módulo de Egresos para propinas pagadas
- ✅ Verifica las transacciones con los números diarios correctos
- ✅ Valida descriptores de venta en Supabase

## Estrategia de Datos

- **Marcador de ejecución:** `E2E_MATRIX_<timestamp>_<seed>`
- **Propósito:** Identificar ventas y propinas de forma determinista
- **Seed aleatorio:** Genera datos reproducibles
- **Ledger interno:** Mantiene expectativas de totales por método de pago

## Arquitectura del Test

### Módulos utilizados:

| Módulo          | Propósito                            |
| --------------- | ------------------------------------ |
| `matrixPlanner` | Genera escenarios de prueba          |
| `seededRng`     | Generador aleatorio determinista     |
| `marker`        | Crea identificadores de ejecución    |
| `ledger`        | Mantiene expectativas de totales     |
| `dbWaits`       | Polling de Supabase para datos async |
| `assertions`    | Validaciones de UI y datos           |
| `uiHelpers`     | Interacciones con la aplicación      |

### Edge Cases Validados:

- ✅ Escenarios con precio mínimo (80 BS)
- ✅ Escenarios con precio máximo (2000 BS)
- ✅ Distribución máxima de 3 ventas por método de pago
- ✅ Al menos un escenario por cada estado de propina (none, pending, paid)

## Comandos de Ejecución

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sales-tips-matrix.e2e.spec.ts
```

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sales-tips-matrix.e2e.spec.ts --debug
```

## Casos Borde Cubiertos

- ✅ Venta con precio personalizado
- ✅ Propina none (sin propina)
- ✅ Propina pending (pendiente de pago)
- ✅ Propina paid (pagada)
- ✅ Múltiples métodos de pago
- ✅ Propagación a Dashboard
- ✅ Propagación a Módulo de Propinas
- ✅ Propagación a Módulo de Egresos
- ✅ Propagación a Transacciones
- ✅ Validación de descriptores en BD
- ✅ Conteo de propinas por estado

## Casos Borde NO Cubiertos

- 💩 Breakpoints de precio específicos
- 🔄 Pagos mixtos en ventas
- 🔄 Edición de venta con propina
- 🔄 Eliminación de venta con propina

## Dependencias

- `@playwright/test`
- `supabaseClient.ts` - Queries de Supabase
- `waterSalesTipsMatrix/*` - Módulos del test

---

**Última actualización:** 2026-03-24
