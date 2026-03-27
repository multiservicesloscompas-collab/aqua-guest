# Domain: Settings, Exchange Rates & Expenses (Configuración y Egresos)

## 🎯 Business Goal

Manage the core financial parameters of the application, including the daily exchange rate (Bs/USD), liter pricing breakpoints, and operational expenses. Also handles transfers between different payment methods (Equilibrio de Pagos).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`AppConfig`**: `exchangeRate` (Bs/USD), `lastUpdated`, `literPricing[]`, `exchangeRateHistory[]`.
- **`LiterPricing`**: `breakpoint` (liters), `price` (Bs).
- **`ExchangeRateHistory`**: `date` (YYYY-MM-DD), `rate` (Bs/USD), `updatedAt`.
- **`Expense`**: `id`, `date`, `description`, `amount` (Bs), `category` ('operativo' | 'insumos' | 'servicios' | 'mantenimiento' | 'personal' | 'otros'), `paymentMethod`, `notes`, `createdAt`.
- **`PaymentBalanceTransaction`**: `id`, `date`, `operationType` (`equilibrio` | `avance`), `fromMethod`, `toMethod`, `amount` (legacy compat), `amountBs`, `amountUsd`, `amountOutBs`, `amountOutUsd`, `amountInBs`, `amountInUsd`, `differenceBs`, `differenceUsd`, `notes`, `createdAt`, `updatedAt`.
- **`PaymentBalanceSummary`**: `method`, `originalTotal`, `adjustments`, `finalTotal`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `config`, `expenses`, `paymentBalanceTransactions`.
- **State (mixed payment flags):** `mixedPaymentFlags` (`enabled`, `water`, `rentals`) persisted in `useConfigStore`.
- **Actions:** `setExchangeRate`, `setLiterPricing`, `setMixedPaymentFlags`, `addExpense`, `updateExpense`, `deleteExpense`, `addPaymentBalanceTransaction`, `updatePaymentBalanceTransaction`, `deletePaymentBalanceTransaction`.
- **Getters/Derived:** `getExchangeRateForDate(date)`, `getPriceForLiters(liters)`, `getExpensesByDate(date)`, `getPaymentBalanceSummary(date)`.

### Services (`src/services/`)

- **`CurrencyService.ts`**: `createCurrencyConverter(exchangeRate)` for USD/Bs conversions.
- **`ExpensesDataService.ts`**: `loadExpensesByDateRange()` handles caching and fetching of expenses.

## 🧩 Key UI Components

- **`ConfigPage` (`src/pages/ConfigPage.tsx`)**: UI to update `exchangeRate` and `literPricing`.
- **`ConfigPage` (`src/pages/ConfigPage.tsx`)**: UI to update `exchangeRate` and includes **Más opciones > Limpiar caché** con confirmación previa para reset local seguro.
- **`ExchangeHistoryPage` (`src/pages/ExchangeHistoryPage.tsx`)**: Displays the `exchangeRateHistory` with trend indicators.
- **`ExpensesPage` (`src/pages/ExpensesPage.tsx`)**: List of expenses by day or week (`WeeklyExpensesView`), with actions to add, edit, or delete.
- **Egresos derivados por propina pagada:** `ExpensesPage` integra `tipPayouts` (desde `useTipStore`) como filas derivadas de solo lectura en vista diaria y semanal. Estas filas usan fecha efectiva de pago (`paidAt` fallback `tipDate`), método de pago del payout, monto `amountBs`, etiqueta `Pago de Propina`, y no exponen acciones de editar/eliminar para evitar mutaciones indebidas o doble conteo.
- **`PaymentBalancePage` (`src/pages/PaymentBalancePage.tsx`)**: UI to transfer funds between payment methods (e.g., from 'pago_movil' to 'efectivo') and view the daily summary.

## 📱 Responsive Secondary Flows (Phase 4)

- `ExpensesPage` ahora usa `AppPageContainer` + `TabletSplitLayout` en tablet:
  - columna principal: controles (`DateSelector`, toggle de vista, total diario, CTA) seguidos del listado diario/semanal de egresos.
  - columna secundaria sticky: reservada para contenido complementario no bloqueante.
  - en mobile `<768px` se conserva el stack original y FAB.
- `PaymentBalancePage` en tablet separa:
  - columna principal: `DateSelector` + resumen + controles/formulario, y luego historial de transferencias.
  - columna secundaria sticky: reservada para contenido complementario no bloqueante.
  - en mobile `<768px` se mantiene orden original sin cambios estructurales.
- `TransactionsSummaryPage` en tablet separa:
  - columna principal: timeline de transacciones.
  - columna secundaria sticky: cards de totales (ingresos/egresos).
  - en mobile `<768px` continúa el flujo original (totales arriba + lista).
- **Timeline split-aware en transacciones:** cuando ventas/alquileres tienen `paymentSplits` válidos (2+ métodos), la lista genera filas por split y etiqueta el badge como `Pago mixto · <Método>`, con fallback a fila única por `paymentMethod` legacy en registros simples/inválidos.
- **Card de timeline robusta ante método ausente:** `TransactionsSummaryList` renderiza badge de método solo cuando `paymentMethod` está definido, evitando artefactos (`undefined`) en filas edge.
- `PaymentMethodDetailPage` en tablet separa:
  - columna principal: lista de transacciones por método.
  - columna secundaria sticky: fecha + KPI total + resumen/switcher.
  - en mobile `<768px` se mantiene el flujo preexistente.
- **Detalle por método split-aware (cards):** cuando una venta/alquiler pertenece a un pago mixto, la fila se rotula como `... · Pago mixto` y muestra badge del método atribuido (`Pago Móvil`, `Efectivo`, etc.) para evitar ambigüedad del componente del split en esa vista.
- **Referencia explícita por fila en detalle por método:** cada transacción en `PaymentMethodDetailPage` ahora muestra un vínculo visible (`linkedReference`) para identificar el origen (`Venta #<dailyNumber>`, `Alquiler #<id corto>`, `Propina de ...`), con fallback seguro cuando no existe relación resoluble en memoria.
- **Tests de regresión de cards de finanzas:** existen pruebas específicas para `TransactionsSummaryList` y `PaymentMethodTransactionsCard` validando etiqueta/badge split-aware y fallback seguro en casos sin método.
- **`TipsPage` (Propinas):** mantiene navegación diaria con `DateSelector` y recarga por fecha seleccionada, con layout mobile-first reforzado (resumen superior con total + contadores de `Pendientes`/`Pagadas`, CTA principal `Pagar Todas del Dia` y cards más jerárquicas por propina).
- **Normalización de fecha en Propinas (timezone-safe):** el filtrado diario normaliza `tipDate` a fecha Venezuela (`America/Caracas`) antes de comparar con `selectedDate`, evitando que timestamps ISO cercanos a medianoche UTC se clasifiquen en un día incorrecto.
- **Vinculación de origen en Propinas:** cada propina resuelve la transacción asociada usando datos del día (`sales` y `rentals`) para mostrar `Venta #<dailyNumber>` o `Alquiler - <cliente>`. Si no existe match, se renderiza fallback explícito `Origen no disponible (<originType>: <originId>)`.
- **Edición inline de notas en Propinas:** cada card mantiene edición/guardado inline con persistencia en Supabase (`tips.notes`) vía `useTipStore.updateTipNote`, con CTAs visualmente consistentes (`Editar Nota`, `Guardar Nota`, `Cancelar`) y acción de pago individual distinguida por estado.
- **Snapshot monetario de propinas en write-path:** al crear/actualizar tip ligada a `sale` o `rental`, el cliente persiste `amount_bs` junto con `amount_usd` y `exchange_rate_used` usando la tasa vigente de `useConfigStore().config.exchangeRate` en ese instante, evitando depender solo de conversiones en lectura para históricos.

## 🛡️ Hardening + verify-ready responsive (Phase 5)

- `ExpensesPage`, `TransactionsSummaryPage`, `PaymentMethodDetailPage` y `PaymentBalancePage` usan patrones compartidos de split/sticky tablet (`tabletLayoutPatterns`) para reducir drift visual y facilitar mantenimiento.
- Overlays en finanzas quedan estandarizados con soporte tablet opt-in (`SheetContent.tabletSide/tabletClassName`) manteniendo variante mobile bottom-sheet en `<768px`.
- Se incorporó matriz formal de validación viewport/orientación (`viewportValidationMatrix.test.ts`) y cobertura responsive focalizada para dejar el batch listo para verify.

## ⚙️ Agent Implementation Rules (CRITICAL)

### Exchange Rates

1.  **Global Rate vs. Transaction Rate:** The global `config.exchangeRate` is the _current_ active rate. However, historical transactions (Sales, Rentals, Prepaid) MUST preserve the `exchangeRate` valid at the exact moment they were created to prevent historical data corruption.
2.  **History:** When updating `config.exchangeRate` via `setExchangeRate`, the `exchangeRateHistory` array must be updated. Only one entry per `date` (YYYY-MM-DD) is allowed.
3.  **Dashboard Currency Switcher:** The Dashboard's ability to switch between Bolívares (Bs) and USD calculations relies entirely on the historical exchange rates configured here. If an old transaction lacks an explicit rate, the system should fall back to checking the history for that specific date to maintain accuracy.

### Pricing Rules

1.  **Liter Breakpoints:** `literPricing` uses breakpoints (e.g., 2L, 5L, 19L). `getPriceForLiters(liters)` MUST find the smallest breakpoint greater than or equal to the requested liters. If the requested liters exceed all breakpoints, use the price of the highest breakpoint.
2.  **Base Currencies:** Water sales (Sales, Prepaid) are priced natively in **Bolívares (Bs)**. Washer Rentals are priced natively in **USD**.

### Payment Balance (Equilibrio)

1.  **Transfers:** A `PaymentBalanceTransaction` represents moving money from one method to another (e.g., cashing out 'punto_venta' to 'efectivo').
2.  **Dual amount semantics (avance-ready):** write/read paths prioritize explicit `amountOut*` and `amountIn*` fields with derived `difference*`, while preserving fallback compatibility with legacy `amount/amountBs/amountUsd` rows.
3.  **Operation type:** `operationType` defaults to `equilibrio` when absent (legacy rows) and uses `avance` for non-equivalent transfers.
4.  **Divisa Exception:** Transfers involving 'divisa' require special handling. The input amount is usually treated as USD and must be converted to Bs internally using the _current_ `exchangeRate` before saving, while storing the original USD value in `amountUsd`.
5.  **Resumen diario split-aware (Fase 3):** `getPaymentBalanceSummary(date)` must build `originalTotal` from split-aware attribution for sales/rentals (fallback to legacy `paymentMethod` when no splits exist), then apply transfer adjustments using deterministic amount priority: `amountOutBs/amountInBs` → legacy fallback (`amountBs` → `amountUsd * exchangeRate` → `amount`).
6.  **Semántica transversal de lectura (Batch 4):** dashboard, timeline de transacciones y detalle por método comparten la misma resolución de legs (`amountOut*`, `amountIn*`, `difference*`, `operationType`) para evitar drift entre vistas.

### Mixed Payment Availability

1.  **Siempre activo:** mixed payment is treated as always enabled at runtime through `isMixedPaymentEnabledForModule(...)`, independent of persisted flags.
2.  **Sin controles en Configuración:** `ConfigPage` no longer renders the mixed-payment card/switches, so users cannot disable the feature from settings.
3.  **Compatibilidad:** persisted `mixedPaymentFlags` may still exist in storage for backward compatibility, but they are no longer authoritative for enabling/disabling the flow.
4.  **Flujos de Agua/Alquileres:** both modules continue exposing their local mixed-payment UX without depending on configuration toggles.

### Local Cache Reset (new)

1. **Acción acotada a Configuración Global:** la limpieza se expone solo en `ConfigPage` dentro de la sección `Más opciones`.
2. **Confirmación obligatoria:** antes de ejecutar la limpieza, el usuario debe confirmar en diálogo explícito.
3. **Alcance local y seguro:** `clearLocalAppCache()` limpia solo datos locales administrados por la app (`localStorage` con prefijo `aquagest-`, cache persistida de React Query en IndexedDB, Cache Storage API cuando existe, cola offline y cachés en memoria de servicios).
4. **No toca datos remotos:** la rutina no elimina registros del servidor/Supabase.
5. **Rehidratación limpia:** tras éxito, se recarga la app para iniciar con estado local nuevo.

### Expense Mixed Payment Strict Mode (new)

1. **Alta estricta:** `addExpense` now treats split persistence as transactional-at-application-level: create root `expenses` row first, then insert `expense_payment_splits`; if split insert fails, it deletes the just-created expense row and throws.
2. **Edición estricta:** `updateExpense` no longer swallows split delete/insert failures. Any failure while replacing splits throws and aborts local success update.
3. **UI feedback unchanged but now reliable:** `ExpensesPage` existing error toasts are triggered through real throws from the store (no silent success path for split persistence errors).
4. **Submit mixed validado en UI (create/edit):** when mixed payment is active in the expense drawer, `ExpensesPage` normalizes and validates split payloads before `addExpense/updateExpense`; invalid splits show `toast.error` and abort submission.
5. **Compatibilidad legacy en write-path:** `paymentMethod` saved for expenses is derived from normalized splits (dominant split) to keep legacy consumers aligned with split-aware payloads.
6. **Guard anti-colision en formulario mixto:** while mixed mode is active, if primary and secondary methods become equal, the secondary method auto-switches to a different method to guarantee two distinct channels.
