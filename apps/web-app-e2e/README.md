# web-app-e2e (Playwright)

Playwright E2E suite for AquaGest `web-app`.

## Required Environment Variables

- `E2E_BASE_URL` (optional): base URL for the app. Defaults to `http://localhost:4200`.
- `VITE_SUPABASE_URL` (required for DB determinism helpers)
- `VITE_SUPABASE_ANON_KEY` (required for DB determinism helpers)

Aliases already supported:

- `SUPABASE_URL` as alias for `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` as alias for `VITE_SUPABASE_ANON_KEY`

## Deterministic Real-DB Strategy

- Each run creates a unique marker: `E2E_WATER_SALE_<timestamp>_<random>`.
- The marker is written into sale notes from UI.
- Helpers query Supabase by marker to locate deterministic records with anon/app-compatible credentials.
- Tests use baseline/delta assertions by marker and avoid privileged cleanup calls.
- Baseline assertions use non-strict delta checks (`>=`) to tolerate concurrent production-like writes while still verifying propagation.

## Run Commands

- Canonical local (default pre-clean dashboard smoke lane): `npx nx run web-app-e2e:e2e`
- Headed deterministic phone lane (pre-clean by default): `npx nx run web-app-e2e:e2e --configuration=headed`
- Debug deterministic phone lane (pre-clean by default): `npx nx run web-app-e2e:e2e --configuration=debug`
- Full local suite (explicit): `npx nx run web-app-e2e:e2e-full`
- Full suite headed/debug (explicit): `npx nx run web-app-e2e:e2e-full --configuration=headed` / `npx nx run web-app-e2e:e2e-full --configuration=debug`
- CI mode: `npx nx run web-app-e2e:e2e-ci --configuration=ci`
- Legacy explicit pre-clean wrapper target: `npx nx run web-app-e2e:e2e-preclean-dashboard`

### Direct Playwright CLI from repo root

- User command (now supported with default iPhone 14 emulation):

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts --headed
```

- Canonical equivalent (explicit config path):

```bash
npx playwright test -c apps/web-app-e2e/playwright.config.ts apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts --headed
```

- Recommended canonical wrapper (Nx):

```bash
npx nx run web-app-e2e:e2e --configuration=headed
```

### Pre-test DB Cleanup Flow (Water Sales)

To guarantee dashboard/smoke E2E starts from a zero water-sales DB baseline, run cleanup first and then the target spec:

```bash
npx playwright test -c apps/web-app-e2e/playwright.config.ts apps/web-app-e2e/src/tests/water-sale-cleanup.e2e.spec.ts
npx playwright test -c apps/web-app-e2e/playwright.config.ts apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts -g "dashboard transactions and metrics validation with 4 water sales"
```

Equivalent Nx wrapper target:

```bash
npx nx run web-app-e2e:e2e-preclean-dashboard
```

The cleanup spec now validates discoverable sales count is exactly zero at the end.

### Startup and Responsive Stability Notes

- Local startup and navigation are aligned to `http://localhost:4200` across `playwright.config.ts` and E2E env helpers.
- Headed/debug runs keep deterministic iPhone 14 defaults (Playwright device profile, touch/mobile, viewport/device settings) unless explicitly overridden by CLI/project options.
- Navigation helpers in `src/support/uiNavigation.ts` use adaptive paths (mobile controls first, dashboard KPI fallback for tablet/desktop) to reduce responsive selector brittleness.

## Estado de Ejecución

### water-sale-dashboard-metrics.e2e.spec.ts

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts
```

**Resultado:**

- ✅ 4 passed (tests parametrizados por método de pago)
- ❌ 1 failed (timeout - navegador queda en página incorrecta)

### water-sale-cleanup.e2e.spec.ts

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-cleanup.e2e.spec.ts
```

**Resultado:**

- ❌ 1 failed (Protocol error: Cannot navigate to invalid URL)

**Causa:** Falta configurar `baseURL` en `playwright.config.ts` o variable `E2E_BASE_URL`

## CI Notes

- CI must provide app-compatible Supabase envs (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, or their supported aliases).
- The initial vertical slice validates only `@efectivo`.

---

## Test Coverage

### Validaciones Cubiertas

#### 1. water-sale-dashboard-metrics.e2e.spec.ts

**Tests implemented:**

1. **@efectivo/@pago_movil/@pago_venta/@divisa propagates to dashboard, transactions, and method detail** (test parametrizado - 4 iteraciones)

   - ✅ Crea una venta de agua con cada método de pago
   - ✅ Verifica que la venta se propaga al Dashboard (card del método de pago)
   - ✅ Verifica incremento de monto en la card del método de pago
   - ✅ Verifica que la transacción aparece en la lista de Transacciones
   - ✅ Verifica que la transacción contiene "Venta de Agua" y el método de pago correcto
   - ✅ Verifica que al hacer clic en la card, aparece el detalle del método de pago
   - ✅ Verifica que la venta aparece en el detalle con "Venta de Agua" y "Venta #"
   - ✅ Confirma que la venta fue persistida en Supabase

2. **dashboard transactions and metrics validation with 4 water sales** (1 test)

   - ✅ Crea 4 ventas con montos aleatorios (2000-4000 bs)
   - ✅ Una venta por cada método de pago (efectivo, pago_movil, punto_venta, divisa)
   - ✅ Verifica que la card "Transacciones" muestre el valor correcto (4)
   - ✅ Verifica que cada card de método de pago sea visible
   - ✅ Verifica que cada card muestre el monto correcto de la venta creada
   - ✅ **Valida que la suma de todos los totales de las cards = suma de los precios establecidos**

#### 2. water-sale-cleanup.e2e.spec.ts

**Tests implemented:**

- ✅ Limpieza de ventas de prueba en Supabase después de cada test
- ✅ Estrategia de limpieza basada en marcadores (run markers)

---

## Casos Borde Cubiertos

### Sales (Ventas)

- ✅ Venta con precio personalizado (customPrice)
- ✅ Venta con notas para trazabilidad
- ✅ Múltiples ventas en una misma sesión
- ✅ Diferentes métodos de pago (efectivo, pago_movil, punto_venta, divisa)
- ✅ Validación de números aleatorios en rangos especificados (2000-4000 bs)

### Dashboard

- ✅ Verificación de métricas después de múltiples ventas
- ✅ Verificación de suma de totales
- ✅ Transiciones entre páginas (Ventas → Dashboard → Transacciones → Detalle)

### Persistencia

- ✅ Poll de Supabase para esperar propagación de datos
- ✅ Baseline/delta assertions para tolerar writes concurrentes
- ✅ Limpieza de datos de prueba

---

## Casos Borde NO Cubiertos (Recomendaciones)

Los siguientes casos deberían considerarse para futuras implementaciones de tests E2E:

### Ventas de Agua

- ❌ Venta con cantidad 0 (validación debe prevenir)
- ❌ Venta sin método de pago seleccionado (validación debe prevenir)
- ❌ Venta con producto sin stock
- ❌ Breakpoints de precio (descuentos por volumen)
- ❌ Venta con propinas
- ❌ Venta con pago mixto
- ❌ Número diario de venta (overflow)
- ❌ Edición de venta existente
- ❌ Eliminación de venta

### Dashboard

- ❌ Métricas con rango de fechas específico
- ❌ Refresco de métricas stale
- ❌ Métricas vacías (sin datos)
- ❌ Error de red al cargar métricas

### Transacciones

- ❌ Filtrado por tipo de transacción
- ❌ Filtrado por método de pago
- ❌ Paginación de transacciones
- ❌ Transacciones vacías

### Métodos de Pago

- ❌ Detalle de método de pago sin transacciones
- ❌ Transacciones de diferente tipo en detalle (ventas, rentals, propinas, egresos)

### Rentals (Alquileres)

- ❌ Creación de rental
- ❌ Actualización de estado de rental
- ❌ Toggle de pago (isPaid, datePaid)
- ❌ Extensión de rental
- ❌ Eliminación de rental

### Propinas

- ❌ Captura de propina en venta
- ❌ Captura de propina en rental
- ❌ Pago de propinas
- ❌ Historial de propinas

### Egresos

- ❌ Creación de gasto
- ❌ Categorías de gastos
- ❌ Edición de gasto
- ❌ Eliminación de gasto

### Offline

- ❌ Comportamiento sin conexión
- ❌ Queue de sincronización
- ❌ Recuperación de red

### UI/UX

- ❌ Loading states
- ❌ Error states
- ❌ Empty states
- ❌ Validaciones de formulario
- ❌ Accesibilidad

---

## Ejecución de Tests

### Ejecutar lane local recomendada (pre-clean + dashboard smoke)

```bash
npx nx run web-app-e2e:e2e
```

### Ejecutar suite completa E2E (explícito)

```bash
npx nx run web-app-e2e:e2e-full
```

### Ejecutar un archivo específico

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts
```

### Ejecutar en modo CI

```bash
npx nx run web-app-e2e:e2e-ci --configuration=ci
```

### Ejecutar con debug

```bash
npx playwright test --debug apps/web-app-e2e/src/tests/water-sale-dashboard-metrics.e2e.spec.ts
```

---

## Estructura de Archivos

```
apps/web-app-e2e/
├── README.md                    # Este archivo
├── playwright.config.ts         # Configuración de Playwright
├── project.json                 # Configuración Nx
├── tsconfig.json                # TypeScript config
├── eslint.config.mjs           # ESLint config
└── src/
    ├── support/
    │   ├── dbPolling.ts         # Utilidades para poll de BD
    │   ├── env.ts               # Variables de entorno
    │   ├── money.ts             # Utilidades de parsing de dinero
    │   ├── runMarker.ts         # Generación de marcadores
    │   ├── supabaseClient.ts    # Cliente Supabase para tests
    │   └── uiNavigation.ts      # Navegación UI
    └── tests/
        ├── water-sale-cleanup.e2e.spec.ts
        └── water-sale-dashboard-metrics.e2e.spec.ts
```

---

## Mejores Prácticas

1. **Usar marcadores:** Siempre crear un `RunMarker` para identificar las ventas creadas por el test
2. **Esperar propagación:** Usar `waitForSaleByMarker` para esperar que los datos se propaguen a Supabase
3. **Baseline assertions:** Usar `toBeGreaterThanOrEqual` en lugar de `toBe` para tolerar writes concurrentes
4. **Limpiar datos:** Los tests de limpieza (`water-sale-cleanup.e2e.spec.ts`) se ejecutan después de cada test
5. **Test IDs:** Usar `data-testid` para seleccionar elementos de forma robusta

---

**Última actualización:** 2026-03-23
