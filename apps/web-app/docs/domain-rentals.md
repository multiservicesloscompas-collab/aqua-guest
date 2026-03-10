# Domain: Washer Rentals (Alquiler de Lavadoras) & Tracking

## 🎯 Business Goal

Manage the rental of washing machines by scheduling shifts (medio, completo, doble), auto-calculating pickup times based on business hours, handling delivery fees, extending rental periods, and tracking the status of active rentals (Agendado -> Enviado -> Finalizado).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`WasherRental`**: `id`, `date`, `customerId`, `customerName`, `customerPhone`, `customerAddress`, `machineId`, `shift` ('medio' | 'completo' | 'doble'), `deliveryTime` (HH:mm), `pickupTime` (HH:mm), `pickupDate` (YYYY-MM-DD), `deliveryFee` (USD), `totalUsd` (USD), `paymentMethod`, `status` ('agendado' | 'enviado' | 'finalizado'), `isPaid` (boolean), `datePaid` (YYYY-MM-DD), `notes`, `extensions[]`, `originalPickupTime`, `originalPickupDate`, `createdAt`, `updatedAt`.
- **Compatibilidad pago mixto (Fase base):** `WasherRental` soporta `paymentSplits?: PaymentSplit[]` como campo opcional para rollout gradual, manteniendo `paymentMethod` como compatibilidad legacy.
- **Write-path pago mixto (Fase 2):** los flujos crear/editar construyen splits normalizados desde UI (método principal/secundario), validan totales y persisten en `rental_payment_splits` vía adapters. `payment_method` en `washer_rentals` sigue como campo derivado de compatibilidad.
- **`RentalShiftConfig`**: Defines `hours` and `priceUsd` for each shift type.
- **`RentalExtension`**: `additionalHours`, `additionalFee` (USD), `notes`.
- **`WashingMachine`**: `id`, `name`, `kg`, `brand`, `status` ('disponible' | 'mantenimiento' | 'averiada'), `isAvailable`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `rentals`, `washingMachines`.
- **Actions:** `addRental`, `updateRental`, `deleteRental`, `addWashingMachine`, `updateWashingMachine`, `deleteWashingMachine`.
- **Getters/Derived:** `getRentalsByDate(date)`, `getActiveRentalsForDate(date)`.

## 🧩 Key UI Components

- **`RentalsPage` (`src/pages/RentalsPage.tsx`)**: Main list of rentals for a specific date. Shows KPIs (active rentals, earnings, paid amount).
- **`RentalList` (`src/components/alquiler/RentalList.tsx`)**: Renders `RentalCard` components with status and payment toggles.
- **Cards split-aware (registros):** `RentalList` + `RentalCardDetails` usan un read-model de presentación para mostrar `Pago mixto` con líneas por método y montos Bs/USD cuando existen `paymentSplits` válidos; si no, conservan el fallback legacy por `paymentMethod`.
- **`RentalSheet` (`src/components/alquiler/RentalSheet.tsx`)**: Bottom sheet to create a new rental. Includes `CustomerSearch`, machine selection, shift, delivery fee, and auto-calculated pickup time.
- **`EditRentalSheet` (`src/components/alquiler/EditRentalSheet.tsx`)**: Bottom sheet to modify an existing rental (status, payment, machine, delivery time).
- **Activación de pago mixto (crear/editar):** cuando `isMixedPaymentEnabled('rentals')` está activo en configuración, ambos sheets muestran primero un botón CTA de "Pago mixto" (mismo tono y presentación de Agua) y solo revelan los campos de reparto al activarlo; al desactivar, se limpia el monto editable para evitar arrastre de input previo.
- **Consistencia visual/jerárquica Agua ↔ Alquiler:** crear y editar reutilizan el bloque compartido `SaleMixedPaymentFields` (variante `select`), unificando microcopy (`Pago mixto`, `Monto método principal/secundario`, `Método secundario`), espaciado y jerarquía textual sin alterar reglas de cálculo o persistencia.
- **`ExtensionDialog` (`src/components/alquiler/ExtensionDialog.tsx`)**: Dialog to extend a rental period, auto-recalculating the new pickup time and additional fee.
- **`FollowUpPage` (`src/pages/FollowUpPage.tsx`)**: Consolidates rentals requiring attention (unpaid, scheduled, in progress).
- **`DeliverysPage` (`src/pages/DeliverysPage.tsx`)**: Historical view of rentals with a delivery fee > 0.

## 📱 Responsive Core (Phase 3)

- `RentalsPage` integra primitivas responsive (`AppPageContainer` + `TabletSplitLayout`) para tablet portrait/landscape.
- En tablet:
  - Columna principal: `DateSelector` + `RentalsSummaryCards` + `RentalList` (o estado de carga), en ese orden.
  - Columna secundaria fija: reservada para contenido complementario no bloqueante.
- En mobile `<768px` se mantiene la pila original (`DateSelector`, resumen, listado, FAB y sheet) sin cambios estructurales.

## 📱 Responsive Secondary Flows (Phase 4)

- `FollowUpPage` muestra una sola lista de alquileres no finalizados, sin secciones visuales separadas, con orden de prioridad fijo: `No pagadas` -> `Enviadas` -> `Agendadas`.
- `FollowUpPage` usa una sola card de filtro por estado de pago (`Todos`, `No pagadas`, `Pagadas`), aplicada sobre el conjunto base de alquileres no finalizados.
- En tablet y mobile se conserva `TabletSplitLayout`/stack responsive, manteniendo el look & feel existente de la app.
- Se reutiliza `ExtensionDialog` sin cambios funcionales; la adaptacion es solo de distribucion visual.
- `DeliverysPage` en tablet mantiene `DeliveryFiltersCard` en columna principal y `DeliveryStatsGrid` en columna secundaria, pero el `DeliveryListSection` se renderiza despues del bloque de metricas para conservar el listado como ultima seccion del flujo.

## 🛡️ Hardening tablet overlays/layouts (Phase 5)

- `ExtensionDialog` ahora declara `tabletClassName` en `DialogContent` para ampliar ancho útil en tablet (`sm:max-w-[520px]`) y conservar base mobile (`sm:max-w-[425px]`) sin modificar lógica de negocio.
- Los layouts tablet de `RentalsPage` y `FollowUpPage` usan tokens compartidos (`tabletLayoutPatterns`) para homogeneizar espaciado/sticky en portrait y landscape.
- Se añadieron pruebas responsive específicas para overlay/layout (`ExtensionDialog/index.responsive.test.tsx`, suites de páginas responsive) manteniendo paridad en `<768px`.

## 🔄 Offline Sync Orchestration (hardening)

- `addRental` ahora soporta modo offline: cuando no hay conexión encola el `INSERT` raíz de `washer_rentals` y, si aplica, una acción dependiente para `rental_payment_splits`.
- La cola global conserva dependencia explícita raíz→hijo y usa `tempId` local para reconciliar el `rental_id` real durante replay.
- En reconnect, el orquestador global resuelve el `tempId` del alquiler creado a su ID real de Supabase antes de insertar los splits para evitar huérfanos/duplicados.
- Paridad CRUD offline en alquileres: `updateRental` y `deleteRental` ahora encolan `UPDATE/DELETE` de `washer_rentals` y operaciones de reemplazo/eliminación para `rental_payment_splits`, con actualización local optimista y replay determinista.

## 🔗 Cross-Module Impacts (Side Effects)

Actions taken within the Washer Rentals domain have significant ripple effects across other modules. When modifying rental logic, be aware of these interconnected systems:

1.  **Dashboard & Financial Metrics (`DashboardMetricsService.ts`)**:
    - **Action:** Toggling `isPaid` to `true` (and setting `datePaid`).
    - **Impact:** Instantly increases the `totalIncomeBs` and specific `methodTotalsBs` on the Dashboard for the month and day corresponding to `datePaid`.
    - **Action:** Toggling `isPaid` to `false` (Un-paying).
    - **Impact:** Deducts that money from the Dashboard metrics. If `datePaid` is not properly nullified in Supabase during an "un-pay" (see Bug 03), metrics become permanently corrupted.
2.  **Customer Directory (`domain-customers.md`)**:
    - **Action:** Creating a rental with a brand-new customer name in `RentalSheet`.
    - **Impact:** The `addRental` action in the store automatically intercepts this and fires an INSERT to the `customers` table in Supabase. It creates a new global customer profile before creating the rental, preventing foreign key constraints from failing.
3.  **Deliveries History (`DeliverysPage.tsx`)**:
    - **Action:** Creating or editing a rental with `deliveryFee > 0`.
    - **Impact:** The rental automatically appears in the "Entregas" (Deliveries) page. Changing the status to `finalizado` updates the logistics counters on that page.
4.  **Transactions Summary (`TransactionsSummaryPage.tsx`)**:
    - **Action:** Paying a rental.
    - **Impact:** A new row is injected into the chronological timeline of daily transactions, categorizing it under the specific payment method used.

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Pickup Time Calculation:** NEVER allow manual entry of `pickupTime` or `pickupDate`. It MUST be auto-calculated using `calculatePickupTime` in `src/utils/rentalSchedule.ts` based on the `deliveryDate`, `deliveryTime`, and `shift` duration.
2.  **Business Hours Constraint:** Pickup times MUST respect `BUSINESS_HOURS` (9am-8pm Mon-Sat, 9am-2pm Sun). If a shift ends outside these hours, the pickup time must be adjusted to the next available business hour (e.g., 9am the next day).
3.  **Pricing Rules:** Rental prices are primarily in USD. The `totalUsd` is calculated by `calculateRentalPrice` in `src/utils/rentalPricing.ts` (base price + delivery fee). **Special Rule:** If `shift` is 'completo' (24h) and `paymentMethod` is 'divisa', the base price is $5 instead of the default $6.
4.  **Extensions:** Use `applyExtensionToRental` in `src/utils/rentalExtensions.ts`. This recalculates `pickupTime` and `pickupDate` respecting business hours and adds `additionalFee` to `totalUsd`. Original pickup times must be preserved for tracking.
5.  **Status Flow:** Rentals move from 'agendado' -> 'enviado' -> 'finalizado'. Only non-finalized rentals affect machine availability.
6.  **Machine Availability:** When creating a rental, machines that are currently rented (status !== 'finalizado') and overlap with the requested time slot MUST be disabled.
7.  **Payment Status:** `isPaid` is a boolean. When true, `datePaid` MUST be set to the current date. When false, `datePaid` must be null. Dashboard metrics for rentals rely entirely on `datePaid`, NOT the service `date`.
8.  **Supabase Failures:** If a Supabase write fails (create/update/delete), do not update local state as a fallback. Propagate the error so the UI can notify the user.
