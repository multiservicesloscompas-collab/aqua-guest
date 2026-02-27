# Domain: Water Sales (Venta de Agua)

## 🎯 Business Goal

Manage the sale of drinking water (refills by liters), new bottles, and caps. Support multiple items in a single transaction (cart system) and dynamic pricing based on volume (liters).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`Product`**: `id`, `name`, `defaultPrice` (Bs), `requiresLiters`, `minLiters`, `maxLiters`, `icon`.
- **`CartItem`**: `id`, `productId`, `productName`, `quantity`, `liters` (optional), `unitPrice` (Bs), `subtotal`.
- **`Sale`**: `id`, `dailyNumber`, `date` (YYYY-MM-DD), `items`, `paymentMethod`, `totalBs`, `totalUsd`, `exchangeRate`, `notes`, `createdAt`, `updatedAt`.
- **`PaymentMethod`**: `'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa'`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `products`, `sales`, `cart`.
- **Actions:** `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `completeSale`, `updateSale`, `deleteSale`.
- **Getters/Derived:** `getSalesByDate(date)`.
- **Pricing Engine:** `config.literPricing` defines the price per liter based on breakpoints (e.g., up to 2L, up to 5L, 19L). Use `getPriceForLiters(liters)` to calculate.

## 🧩 Key UI Components

- **`WaterSalesPage` (`src/pages/WaterSalesPage.tsx`)**: Main list of sales for a specific date. Uses `DateSelector` and `PaymentFilter`.
- **`SalesList` (`src/components/ventas/SalesList.tsx`)**: Renders individual sale cards with edit/delete actions.
- **`AddProductSheet` (`src/components/ventas/AddProductSheet.tsx`)**: Bottom sheet to select a product, set quantity/liters, and add to cart.
- **`CartSheet` (`src/components/ventas/CartSheet.tsx`)**: Bottom sheet showing cart items, total calculation (Bs and USD), payment method selection, and checkout button.
- **`WaterMetricsPage` (`src/pages/WaterMetricsPage.tsx`)**: Opens a detailed analytical view of water sales, consolidating statistics like total units sold, total liters dispensed, average sales, and overall total revenue generated.

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Pricing Calculation:** For products with `requiresLiters === true` (water refills), the price MUST be calculated using `getPriceForLiters(liters)` from the store. Do not use `product.defaultPrice`.
2.  **Currency:** Water sales are primarily conducted in Bolívares (Bs). The USD total is calculated at the end of the transaction by dividing `totalBs` by the `exchangeRate` valid at that exact moment.
3.  **Cart Workflow:** A user can add multiple items to the cart. The `completeSale` action takes the entire `cart` array, calculates the totals, generates a `dailyNumber`, and persists the `Sale` object.
4.  **Supabase Failures:** If a Supabase write fails (create/update/delete), do not update local state as a fallback. Propagate the error so the UI can notify the user.
5.  **Daily Number:** The `dailyNumber` is an incremental integer per day, starting at 1. Ensure it's calculated based on the _normalized_ `sale.date`, not the timestamp.
