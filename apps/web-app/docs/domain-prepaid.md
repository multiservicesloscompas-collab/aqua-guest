# Domain: Prepaid Orders (Agua Prepagada)

## 🎯 Business Goal

Manage orders for drinking water that have been paid for in advance but not yet delivered. Track the status (pendiente, entregado) and record the date of payment and delivery.

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`PrepaidOrder`**: `id`, `customerName`, `customerPhone` (optional), `liters`, `amountBs`, `amountUsd`, `exchangeRate`, `paymentMethod`, `status` ('pendiente' | 'entregado'), `datePaid` (YYYY-MM-DD), `dateDelivered` (YYYY-MM-DD), `notes`, `createdAt`, `updatedAt`.
- **`PrepaidStatus`**: `'pendiente' | 'entregado'`.
- **`PaymentMethod`**: `'pago_movil' | 'efectivo' | 'punto_venta' | 'divisa'`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `prepaidOrders`.
- **Actions:** `addPrepaidOrder`, `updatePrepaidOrder`, `deletePrepaidOrder`, `markPrepaidAsDelivered`.
- **Pricing Engine:** `config.literPricing` defines the price per liter based on breakpoints. Use `getPriceForLiters(liters)` to calculate.

## 🧩 Key UI Components

- **`PrePaysPage` (`src/pages/PrePaysPage.tsx`)**: Main list of prepaid orders with tabs for 'Pendientes', 'Entregados', and 'Todos'. Displays order details, customer info, and actions to edit, delete, or mark as delivered.

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Status Flow:** Orders start as 'pendiente'. When a user clicks "Marcar Entregado", the `markPrepaidAsDelivered` action MUST update the `status` to 'entregado' and set `dateDelivered` to the current date (`getVenezuelaDate()`).
2.  **Payment Processing:** Unlike `Sale`s, prepaid orders are assumed to be paid immediately upon creation. `datePaid` is set to the current date during `addPrepaidOrder`.
3.  **Pricing Calculation:** The price (`amountBs`) is calculated based on `liters` using `getPriceForLiters` from the store, exactly like a standard water sale. The `amountUsd` is calculated by dividing `amountBs` by `exchangeRate` at the time of creation.
4.  **Customer Linking:** The `customerName` is required. While `customerPhone` is optional, it is recommended for contact purposes. This is a standalone entity, independent of the `customers` table, although names might match.
5.  **Metrics Integration:** Prepaid orders (amountBs/Usd) are included in the `DashboardMetricsService` (`src/services/DashboardMetricsService.ts`) under `totalIncomeBs` based on their `datePaid`. They are NOT counted again when delivered.
6.  **Supabase Failures:** If a Supabase write fails (create/update/delete/mark delivered), do not update local state as a fallback. Propagate the error so the UI can notify the user.
