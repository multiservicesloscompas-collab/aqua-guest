# web-app-e2e (Playwright)

Playwright E2E suite for AquaGest `web-app`.

## Required Environment Variables

- `E2E_BASE_URL` (optional): base URL for the app. Defaults to `http://localhost:4300`, a dev server dedicated to e2e (never the one `npm run local` serves on 4200).
- `VITE_SUPABASE_URL` (required for DB determinism helpers)
- `VITE_SUPABASE_ANON_KEY` (required for DB determinism helpers)

Aliases already supported:

- `SUPABASE_URL` as alias for `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` as alias for `VITE_SUPABASE_ANON_KEY`

## Data policy: every test starts from zero

Every spec imports `test` and `expect` from `src/support/fixtures.ts`. Before each test that fixture wipes the whole local domain (sales, rentals, expenses, tips, prepaid orders, payment balance transfers, customers, machines, exchange rates, liter pricing, products) and seeds the baseline in `src/support/reset/baseline.ts`:

| Data          | Baseline                                                                        |
| :------------ | :------------------------------------------------------------------------------ |
| Exchange rate | today (Caracas) = 1000 Bs per USD                                               |
| Liter pricing | 2 L = 100, 5 L = 200, 8 L = 300, 12 L = 450, 15 L = 550, 19 L = 700, 24 L = 850 |
| Products      | the 6 products of `supabase/seed.sql` (refill priced 700)                       |
| Machines      | Lavadora 1 to 5, 10 to 18 kg, status `disponible`                               |
| Customers     | Cliente Prueba 1 to 4                                                           |

A test can therefore delete customers or machines without affecting the next one. Baseline values are e2e-only; they do not change the defaults the app ships with. Use integer Bs amounts so the dashboard KPIs (`toFixed(0)`) never land on a half.

Specs still tag their records with a run marker (`E2E_WATER_SALE_<timestamp>_<random>`) to find them in the database.

### Reset commands

These wipe the local database. They abort unless `VITE_SUPABASE_URL` points to `127.0.0.1` or `localhost`, and they never print credentials.

- `npm run e2e:reset` wipes everything and seeds the baseline.
- `npm run e2e:purge` wipes everything and seeds nothing (absolute zero).
- `npm run e2e:reset:dry` prints the row count per table and deletes nothing.

They run through `playwright.maintenance.config.ts`, which has no browser and no web server.

## Run Commands

- Whole regression suite, every spec from zero: `npx nx run web-app-e2e:e2e` (or `npm run e2e:web-app`)
- Headed / debug: `npx nx run web-app-e2e:e2e --configuration=headed` / `--configuration=debug`
- Full suite including the `bugs` project: `npx nx run web-app-e2e:e2e-full`
- CI mode: `npx nx run web-app-e2e:e2e-ci --configuration=ci`
- `npx nx run web-app-e2e:e2e-preclean-dashboard` is kept as an alias of `e2e`; the pre-clean now happens in the fixture.

### Live runner (`npm run e2e:live`)

Interactive runner. For every test it shows what the test tries to do and what result it expects, runs it with a narrating reporter (`E2E_NARRATE=1`: ficha before, ✔/✘ with expected-vs-found after), and afterwards offers to reset the database to the baseline, purge it, or leave it.

```bash
npm run e2e:live                                   # menu: run, explain, database, settings
npm run e2e:live -- --explain reset                # print fichas of matching tests, run nothing
npm run e2e:live -- --explain all                  # every ficha
npm run e2e:live -- --check                        # exit 1 if a test lacks a complete ficha
npm run e2e:live -- --list                         # flat test list and database counts
npm run e2e:live -- --spec water-sales-tips-matrix --slowmo 500
npm run e2e:live -- --test "@efectivo" --headless --yes --after none
npm run e2e:live -- --all --headless --yes --after reset
npm run e2e:live -- --test "4 simple" --print      # only print the Playwright command
```

Menu selection accepts `3`, `3,5`, `3-6` or `a`. With 3 tests or fewer the full ficha is printed before asking for confirmation. Time estimates come from the last run (`node_modules/.cache/aquaguest-e2e/timings.json`). Without a terminal it requires `--yes`.

### Documenting tests (required)

Every test is written with `documented()` from `support/fixtures`, and the fichas are in Spanish:

```ts
test(
  'title',
  documented({
    titulo: 'Nombre corto en español.',
    area: 'Ventas de agua',
    intent: 'Qué comprueba, en una frase.',
    steps: ['Qué hace, paso a paso.'],
    expects: ['Qué resultado espera, con cifras exactas.'],
    data: 'Datos fijos opcionales.',
  }),
  async ({ page }) => {
    /* ... */
  }
);
```

`titulo` and `area` drive the runner menu (grouped by area; the `Herramientas de prueba (internas)` area is listed last). The ficha lives in Playwright annotations, so the runner, the narrator and the HTML report read the same source. `npm run e2e:live -- --check` fails when a test has no intent, no step or no expectation.

Never assert a toast with a bare `getByText`: two identical toasts overlap for about 4 s and trigger a strict-mode violation. Use `expectToast` from `support/toasts.ts`, and prove the effect with a database check.

### Known bugs (`npm run e2e:bugs`)

Specs in `src/tests/bugs/*.bugs.e2e.spec.ts` (project `bugs`) assert the CORRECT behavior, so they are red until the bug is fixed; each has a `.md` with the user action, expected, actual and root cause, and a `bugDoc()` ficha (`support/bugs/ficha.ts`). Controls (`control: true`) pin nearby behavior that already works and must stay green. They are not part of `npm run e2e:web-app`. Run them with the bug runner, `npm run e2e:bugs` (menu, or `-- --id B9,FIN-02 --yes`; `-- --explain [ID|all]` only prints). For each bug it shows the objective, why it fails today, the root cause, what to fix and where, runs it with the browser visible and stops on the failing screen (Playwright inspector, press Resume; `--no-pause` to skip), and ends with a table: 🔴 still open, 🟢 fixed or control green, ⚠ a control regressed or the bug failed for another reason than its assertion. `npm run e2e:bugs:ci` is the plain non-interactive run. `npm run e2e:live -- --bugs` still works too.

Cause, fix and where live in `support/bugs/bugKnowledge.ts`, keyed by bug id (`fix` is a proposal, not a verified patch); `bugDoc` reads them, so a new bug needs its entry. `npm run e2e:bugs -- --check` fails if a bug lacks them. Follow the bug flow in `docs/agents/workflow.md`: red e2e, the user confirms, then fix.

### Scenarios (combined movements)

`src/support/scenarios` describes what a person can do in the app as plain-data steps: `sale`, `rental`, `expense`, `transfer`, `payTip`, `markPaid`, `edit`, `delete`. Sales and rentals take a simple or mixed payment and an optional tip; editing is limited to records with a simple payment and no tip (tip edits are the known bug B3). Prepaid orders and rental extensions are deliberately not covered (features expected to go away).

- `support/ledger/ledger.ts` computes the figures the dashboard must show (income, expenses, net, transactions, the four method cards) from the business rules, never from the app's formulas. Check it with `ledger.calc.e2e.spec.ts`.
- `support/scenarios/run.ts` runs each step through the UI and compares the dashboard with the ledger after every step, naming the step in the failure message.
- The ficha of a scenario is generated from its steps. Add a scenario to `support/scenarios/library.ts`, or build one from the runner (menu option 5) and save it: it is written to `src/scenarios/*.json` and runs like any other test. `pairwise.ts` generates a small set of scenarios that cover every pair of options (module × payment × tip × later action).
- A new kind of movement needs: a step type, `applyStep`/`describeStep` in `apply.ts`, a driver in `support/drivers`, and a case in `run.ts`.

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

### The cleanup spec

`water-sale-cleanup.e2e.spec.ts` no longer wipes the database (the fixture does). It seeds three sales and deletes them through the UI, then checks that the database and Transactions show none.

### Startup and Responsive Stability Notes

- Local startup and navigation are aligned to `http://localhost:4300` across `playwright.config.ts` and E2E env helpers.
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
