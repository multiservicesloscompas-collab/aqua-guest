# Domain: Washer Rentals (Alquiler de Lavadoras) & Tracking

## 🎯 Business Goal

Manage the rental of washing machines by scheduling shifts (medio, completo, doble), auto-calculating pickup times based on business hours, handling delivery fees, extending rental periods, and tracking the status of active rentals (Agendado -> Enviado -> Finalizado).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`WasherRental`**: `id`, `date`, `customerId`, `customerName`, `customerPhone`, `customerAddress`, `machineId`, `shift` ('medio' | 'completo' | 'doble'), `deliveryTime` (HH:mm), `pickupTime` (HH:mm), `pickupDate` (YYYY-MM-DD), `deliveryFee` (USD), `totalUsd` (USD), `paymentMethod`, `status` ('agendado' | 'enviado' | 'finalizado'), `isPaid` (boolean), `datePaid` (YYYY-MM-DD), `notes`, `extensions[]`, `originalPickupTime`, `originalPickupDate`, `createdAt`, `updatedAt`.
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
- **`RentalSheet` (`src/components/alquiler/RentalSheet.tsx`)**: Bottom sheet to create a new rental. Includes `CustomerSearch`, machine selection, shift, delivery fee, and auto-calculated pickup time.
- **`EditRentalSheet` (`src/components/alquiler/EditRentalSheet.tsx`)**: Bottom sheet to modify an existing rental (status, payment, machine, delivery time).
- **`ExtensionDialog` (`src/components/alquiler/ExtensionDialog.tsx`)**: Dialog to extend a rental period, auto-recalculating the new pickup time and additional fee.
- **`FollowUpPage` (`src/pages/FollowUpPage.tsx`)**: Consolidates rentals requiring attention (unpaid, scheduled, in progress).
- **`DeliverysPage` (`src/pages/DeliverysPage.tsx`)**: Historical view of rentals with a delivery fee > 0.

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
