# Domain: Dashboard & Global Metrics

## 🎯 Business Goal

Provide an at-a-glance financial and operational summary of the business. This is the first screen the user sees (Index route). It displays daily and Month-To-Date (MTD) gross income, net profit (income minus expenses), total transactions, a breakdown of income by payment method, a weekly sales chart, and recent sales activity.

## 🗄️ Data Structure & Services (Supabase, Zustand & Services)

### Key Types (`src/types/index.ts` & `src/services/DashboardMetricsService.ts`)

- **`ScopeMetrics`**: `waterBs`, `rentalBs`, `totalIncomeBs`, `expenseBs`, `netBs`, `transactionsCount`, `methodTotalsBs` (Record of PaymentMethod -> number).
- **`DashboardMetricsResult`**: Contains `day` (ScopeMetrics) and `mtd` (ScopeMetrics).
- **`ChartDataPoint`**: `label` (day of week), `value`, `date`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State Used:** `sales`, `expenses`, `rentals`, `prepaidOrders`, `paymentBalanceTransactions`, `config.exchangeRate`, `selectedDate`.
- **Actions:** `loadDataForDateRange`, `setSelectedDate`.

### Core Services

- **`DashboardMetricsService.ts`**: The engine for all dashboard numbers. Its `calculateDashboardMetrics` function aggregates data across all modules for the specific day and MTD.
- **`useWeekData.ts` (Hook):** Calculates the last 7 days of income (Water + Paid Rentals) for the bar chart.
- **`CurrencyService.ts`**: Handles the dynamic conversion between Bolívares (Bs) and USD based on the active global `exchangeRate`.

## 🧩 Key UI Components

- **`DashboardPage` (`src/pages/DashboardPage.tsx`)**: The main aggregator view. Manages the currency toggle state (Bs/USD) and fetches the month's data.
- **`KpiCard` (`src/components/ui/KpiCard.tsx`)**: Reusable UI component for metric blocks (e.g., "Ingresos del Día", "Neto Mes").
- **`RecentSales` (`src/components/dashboard/RecentSales.tsx`)**: Displays the 3 most recent water sales of the day.
- **`SalesChart` (`src/components/dashboard/SalesChart.tsx`)**: Recharts-based bar chart showing income over the last week.

## 🧭 Interactions & Navigation (Routing)

The Dashboard serves as the central hub. Clicking on specific metric cards redirects the user to detailed modules or triggers specific actions:

| UI Component (Card)                     | Action / Purpose                                                                                                                                                      | Target Route                          | Target Module / Page          |
| :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ | :---------------------------- |
| **Egresos hoy** (Expenses Today)        | View and manage the day's expenses.                                                                                                                                   | `/egresos`                            | `ExpensesPage.tsx`            |
| **Transacciones** (Transactions)        | View a chronologically sorted list of all financial events across all modules (water, rentals, expenses, payment balance, prepaid) for the day.                       | `/transacciones`                      | `TransactionsSummaryPage.tsx` |
| **Moneda** (Currency Switcher)          | Toggles the dashboard's display currency between Bolívares (Bs) and USD. This calculation relies on the historical USD exchange rate set in the Configuration module. | _No route change_ (In-place UI state) | `DashboardPage.tsx`           |
| **Métricas de Agua** (Water Metrics)    | Opens a detailed analytical view of water sales (totals, sales by liters, averages, total revenue).                                                                   | `/metricas-agua`                      | `WaterMetricsPage.tsx`        |
| **Equilibrar pagos** (Balance Payments) | Opens the module to manage transfers between different payment methods.                                                                                               | `/equilibrio-pagos`                   | `PaymentBalancePage.tsx`      |
| **Resumen por Pago** (Payment Summary)  | Contains 4 internal cards (one per payment method). Clicking one redirects to a filtered view of all daily transactions for that specific payment method.             | `/metodo-pago/:method`                | `PaymentMethodDetailPage.tsx` |

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Dynamic Calculation:** Dashboard metrics are NEVER stored pre-calculated in the database. They are computed on-the-fly by `DashboardMetricsService` every time the state (`sales`, `rentals`, `expenses`, etc.) or the `selectedDate` changes.
2.  **Income Definition:** "Total Income" (`totalIncomeBs`) strictly consists of:
    - Water Sales (`totalBs`).
    - Prepaid Orders (`amountBs`).
    - Washer Rentals (`totalUsd * exchangeRate`) **ONLY IF** the rental `isPaid` is true AND its `datePaid` falls within the analyzed date range.
3.  **Net Profit Calculation:** "Net Profit" (`netBs`) is always calculated as `totalIncomeBs` minus `expenseBs`.
4.  **Payment Method Breakdown:** When calculating the totals per payment method (`methodTotalsBs`), you MUST:
    - Add income from that method.
    - Subtract expenses paid via that method.
    - Add/Subtract `PaymentBalanceTransaction` (Equilibrio de pagos) where funds were moved into or out of that method.
5.  **Currency Toggling:** The UI allows toggling the entire dashboard between Bs and USD. All base metrics are calculated in Bolívares (`Bs`) by the service. The UI uses `currencyConverter.toUsd()` to display USD values on-the-fly. Never alter the underlying `Bs` data when toggling.
6.  **Data Loading:** The Dashboard is responsible for loading the entire month's data (`loadDataForDateRange`) to ensure MTD (Month-to-Date) calculations are accurate without making excessive single-day queries.
