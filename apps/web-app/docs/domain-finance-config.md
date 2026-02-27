# Domain: Settings, Exchange Rates & Expenses (Configuración y Egresos)

## 🎯 Business Goal

Manage the core financial parameters of the application, including the daily exchange rate (Bs/USD), liter pricing breakpoints, and operational expenses. Also handles transfers between different payment methods (Equilibrio de Pagos).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`AppConfig`**: `exchangeRate` (Bs/USD), `lastUpdated`, `literPricing[]`, `exchangeRateHistory[]`.
- **`LiterPricing`**: `breakpoint` (liters), `price` (Bs).
- **`ExchangeRateHistory`**: `date` (YYYY-MM-DD), `rate` (Bs/USD), `updatedAt`.
- **`Expense`**: `id`, `date`, `description`, `amount` (Bs), `category` ('operativo' | 'insumos' | 'servicios' | 'mantenimiento' | 'personal' | 'otros'), `paymentMethod`, `notes`, `createdAt`.
- **`PaymentBalanceTransaction`**: `id`, `date`, `fromMethod`, `toMethod`, `amount` (Bs), `amountBs`, `amountUsd`, `notes`, `createdAt`, `updatedAt`.
- **`PaymentBalanceSummary`**: `method`, `originalTotal`, `adjustments`, `finalTotal`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `config`, `expenses`, `paymentBalanceTransactions`.
- **Actions:** `setExchangeRate`, `setLiterPricing`, `addExpense`, `updateExpense`, `deleteExpense`, `addPaymentBalanceTransaction`, `updatePaymentBalanceTransaction`, `deletePaymentBalanceTransaction`.
- **Getters/Derived:** `getExchangeRateForDate(date)`, `getPriceForLiters(liters)`, `getExpensesByDate(date)`, `getPaymentBalanceSummary(date)`.

### Services (`src/services/`)

- **`CurrencyService.ts`**: `createCurrencyConverter(exchangeRate)` for USD/Bs conversions.
- **`ExpensesDataService.ts`**: `loadExpensesByDateRange()` handles caching and fetching of expenses.

## 🧩 Key UI Components

- **`ConfigPage` (`src/pages/ConfigPage.tsx`)**: UI to update the `exchangeRate` and `literPricing`.
- **`ExchangeHistoryPage` (`src/pages/ExchangeHistoryPage.tsx`)**: Displays the `exchangeRateHistory` with trend indicators.
- **`ExpensesPage` (`src/pages/ExpensesPage.tsx`)**: List of expenses by day or week (`WeeklyExpensesView`), with actions to add, edit, or delete.
- **`PaymentBalancePage` (`src/pages/PaymentBalancePage.tsx`)**: UI to transfer funds between payment methods (e.g., from 'pago_movil' to 'efectivo') and view the daily summary.

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
2.  **Divisa Exception:** Transfers involving 'divisa' require special handling. The input amount is usually treated as USD and must be converted to Bs internally using the _current_ `exchangeRate` before saving, while storing the original USD value in `amountUsd`.
