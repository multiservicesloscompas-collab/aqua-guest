# Domain: Transactions & Payment Summaries

## 🎯 Business Goal
Provide a centralized, chronological audit log of all financial events occurring within a single day. This module acts as the definitive ledger, aggregating data from multiple separate domains (Water Sales, Rentals, Expenses, Prepaid Orders, and Payment Balance Transfers) into a unified view. It also provides deep-dive analytics into daily activity per specific payment method.

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)
*   **`Transaction` (Derived/Unified Interface)**:
    Since there is no single `Transaction` table in Supabase, this module synthesizes a unified structure on-the-fly from various stores:
    *   `id` (Original entity ID)
    *   `type`: `'venta_agua' | 'alquiler' | 'egreso' | 'prepago' | 'equilibrio_pago'`
    *   `date`: Timestamp of the event
    *   `description`: Human-readable summary
    *   `amountBs`: Impact in Bolívares
    *   `amountUsd`: Impact in USD
    *   `paymentMethod`: The associated payment method.

### Zustand Store (`src/store/useAppStore.ts`)
*   **State Used:** `sales`, `rentals`, `expenses`, `prepaidOrders`, `paymentBalanceTransactions`.
*   **Actions Used:** `loadDataForDateRange`, `getSalesByDate`, `getExpensesByDate`, etc.

## 🧩 Key UI Components
*   **`TransactionsSummaryPage` (`src/pages/TransactionsSummaryPage.tsx`)**: The main ledger view. Displays a chronologically sorted list of all financial events for the selected day across all modules.
*   **`PaymentMethodDetailPage` (`src/pages/PaymentMethodDetailPage.tsx`)**: A focused view detailing all IN (Income) and OUT (Expenses/Transfers) transactions for a *single* payment method (e.g., 'pago_movil') on a given day.

## ⚙️ Agent Implementation Rules (CRITICAL)
1.  **Virtual Ledger:** Transactions are NOT stored in a single database table. They must be mapped and aggregated on the frontend from their respective feature slices (Sales, Expenses, etc.) and sorted chronologically before rendering.
2.  **Positive vs. Negative Impact:** When aggregating, clearly distinguish between income (Sales, Prepaid, incoming Transfers) which increases a method's balance, and outflows (Expenses, outgoing Transfers) which decrease it.
3.  **Cross-Domain Dependency:** This domain heavily relies on the Dashboard/AppStore loading the full day's or month's data. Ensure data is fully loaded before calculating the unified transaction list.
4.  **Routing Entry Points:** Users primarily access these views from the `DashboardPage` via the "Transacciones" card or the "Resumen por Pago" payment method cards.
