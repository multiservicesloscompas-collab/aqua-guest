# Domain: Dashboard & Global Metrics

## 🎯 Business Goal

Provide an at-a-glance financial and operational summary of the business. This is the first screen the user sees (Index route). It displays daily and Month-To-Date (MTD) gross income, net profit (income minus expenses), total transactions, a breakdown of income by payment method, and a weekly sales chart.

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
- **Compatibilidad pago mixto (Fase base):** `DashboardMetricsService` now supports split-aware allocation when `paymentSplits` exist, with legacy fallback to `paymentMethod` when splits are absent.
- **Migración métricas/reportes (Fase 3):**
  - Dashboard method totals are split-aware end-to-end for sales/rentals, with deterministic fallback for balance transfers (`amountBs` → `amountUsd*rate` → `amount`).
  - Transactions summary now explodes mixed payments into per-split rows (same visual cards, same navigation).
  - Payment method detail now attributes sales/rentals using split-aware helpers with legacy fallback when no splits exist.
  - Rebaseline propinas v2: ingresos ya incluyen propina en `sale.totalBs` / `rental.totalUsd`; payout de propina se mantiene como egreso explícito (`tip_payout`) para evitar doble conteo semántico en dashboard y transacciones.
- **Avance no equivalente (Batch 4):**
  - Dashboard method totals now apply transfer legs semantically (`amountOut*` debits origin, `amountIn*` credits destination), with deterministic legacy fallback when explicit legs are absent.
  - Timeline transfer rows distinguish `Equilibrio` vs `Avance` and show `Salida`, `Entrada` and `Diferencia` in the same row metadata without redesigning cards.
  - Payment method detail mirrors the same semantics by rendering `Avance/Equilibrio (Salida|Entrada)` with amount-out/amount-in and visible difference trace.
- **`useWeekData.ts` (Hook):** Calculates the last 7 days of income (Water + Paid Rentals) for the bar chart.
- **`CurrencyService.ts`**: Handles the dynamic conversion between Bolívares (Bs) and USD based on the active global `exchangeRate`.

## 🧩 Key UI Components

- **`DashboardPage` (`src/pages/DashboardPage.tsx`)**: The main aggregator view. Manages the currency toggle state (Bs/USD) and fetches the month's data.
- **`KpiCard` (`src/components/ui/KpiCard.tsx`)**: Reusable UI component for metric blocks (e.g., "Ingresos del Día", "Neto Mes").
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

## 📱 Responsive Tablet Shell (sin cambios en mobile)

- La navegación global ahora soporta shell tablet explícito en `src/pages/Index.tsx`:
  - **Mobile `<768px`**: se mantiene `BottomNav` + `MenuSheet` (paridad visual/estructural).
  - **Tablet**: se activa `TabletNavigationRail` lateral y se conserva `MenuSheet` como panel derecho.
- Los items de navegación primaria/secundaria fueron centralizados en `src/components/layout/navigationItems.ts` para evitar divergencia entre `BottomNav`, rail y menú.
- Se restauró la cobertura de navegación entre módulos en el patrón mobile/tablet existente: `MenuSheet` vuelve a exponer accesos a `prepagados`, `metricas-agua`, `transacciones-hoy` y `equilibrio-pagos`, manteniendo `dashboard/ventas/alquiler` en navegación primaria.
- Los controles de navegación (BottomNav, rail y menú) usan `aria-label` y estado activo (`aria-pressed`) para mejorar accesibilidad, claridad de jerarquía y feedback visual sin cambiar la UX base.
- Tokens de shell tablet viven en `src/lib/responsive/layoutTokens.ts` (`TABLET_SHELL_TOKENS`) y se aplican de forma opt-in en `Index`.

## 🧩 Responsive Core (Phase 3)

- `DashboardPage` usa primitivas responsive (`AppPageContainer`, `TabletSectionGrid`, `TabletSplitLayout`) para activar layout tablet incremental sin tocar mobile `<768px`.
- En tablet:
  - Header de contenido queda en grid de 2 columnas (KPI principal + selector de fecha).
  - El bloque principal se divide en columnas: izquierda (`QuickActions`, `SalesChart`) y derecha fija (`PaymentMethodSummary`).
- En mobile `<768px` se conserva el stack previo (sin columnas nuevas ni cambios de jerarquía).

## 📱 Responsive Secondary Modules (Phase 4)

- `TransactionsSummaryPage` (`/transacciones`) migra a patrón tablet con `AppPageContainer` + `TabletSplitLayout`:
  - columna principal: timeline de eventos diarios.
  - columna secundaria sticky: cards de totales (ingresos/egresos).
- `PaymentMethodDetailPage` (`/metodo-pago/:method`) aplica split tablet:
  - columna principal: lista de transacciones del método.
  - columna secundaria sticky: selector de fecha + KPI + resumen/switcher.
- En ambos casos, mobile `<768px` conserva estructura anterior (sin columnas adicionales).

## 🛡️ Responsive Hardening + Verify-ready (Phase 5)

- Se consolidaron patrones de columnas tablet en `src/lib/responsive/tabletLayoutPatterns.ts` para evitar divergencia entre pantallas core/secundarias (`items-start`, `space-y-*`, `sticky top-20`) sin alterar mobile `<768px`.
- Se formalizó matriz de validación por viewport/orientación en `src/lib/responsive/viewportValidationMatrix.test.ts` (límites mobile/tablet portrait/tablet landscape y casos mismatch).
- El shell/overlays tablet continúan siendo opt-in: mobile mantiene `BottomNav + MenuSheet` y comportamiento previo sin cambios estructurales.

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
    - For `PaymentBalanceTransaction`, prioritize explicit transfer legs (`amountOut*` and `amountIn*`); if missing, use deterministic compatibility order (`amountBs`, else `amountUsd * exchangeRate`, else legacy `amount`).
5.  **Currency Toggling:** The UI allows toggling the entire dashboard between Bs and USD. All base metrics are calculated in Bolívares (`Bs`) by the service. The UI uses `currencyConverter.toUsd()` to display USD values on-the-fly. Never alter the underlying `Bs` data when toggling.
6.  **Data Loading:** The Dashboard is responsible for loading the entire month's data (`loadDataForDateRange`) to ensure MTD (Month-to-Date) calculations are accurate without making excessive single-day queries.
