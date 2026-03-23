# Domain: Water Sales (Venta de Agua)

## 🎯 Business Goal

Manage the sale of drinking water (refills by liters), new bottles, and caps. Support multiple items in a single transaction (cart system) and dynamic pricing based on volume (liters).

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`Product`**: `id`, `name`, `defaultPrice` (Bs), `requiresLiters`, `minLiters`, `maxLiters`, `icon`.
- **`CartItem`**: `id`, `productId`, `productName`, `quantity`, `liters` (optional), `unitPrice` (Bs), `subtotal`.
- **`Sale`**: `id`, `dailyNumber`, `date` (YYYY-MM-DD), `items`, `paymentMethod`, `totalBs`, `totalUsd`, `exchangeRate`, `notes`, `createdAt`, `updatedAt`.
- **Compatibilidad pago mixto (Fase base):** `Sale` soporta `paymentSplits?: PaymentSplit[]` como campo opcional. Durante transición, `paymentMethod` se mantiene como fallback/compatibilidad para consumidores legacy.
- **Write-path pago mixto (Fase 2):** en creación/edición se construyen splits normalizados (método principal/secundario), se validan contra `totalBs/totalUsd` y se persisten vía adapters a `sale_payment_splits`, manteniendo `payment_method` derivado para compatibilidad.
- **`PaymentMethod`**: `'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa'`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `products`, `sales`, `cart`.
- **Actions:** `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `completeSale`, `updateSale`, `deleteSale`.
- **Getters/Derived:** `getSalesByDate(date)`.
- **Pricing Engine:** `config.literPricing` defines the price per liter based on breakpoints (e.g., up to 2L, up to 5L, 19L). Use `getPriceForLiters(liters)` to calculate.

## 🧩 Key UI Components

- **`WaterSalesPage` (`src/pages/WaterSalesPage.tsx`)**: Main list of sales for a specific date. Uses `DateSelector` and `PaymentFilter`.
- **`SalesList` (`src/components/ventas/SalesList.tsx`)**: Renders individual sale cards with edit/delete actions.
- **Visualización split-aware en cards (Fase de registros):** cuando una venta tiene `paymentSplits` válidos de 2+ métodos, la card muestra etiqueta `Pago mixto` + desglose por método con montos en Bs y USD; en ventas sin split (o split inválido) mantiene fallback a representación simple por `paymentMethod`.
- **`AddProductSheet` (`src/components/ventas/AddProductSheet.tsx`)**: Bottom sheet to select a product, set quantity/liters, and add to cart.
- **`CartSheet` (`src/components/ventas/CartSheet.tsx`)**: Bottom sheet showing cart items, total calculation (Bs and USD), payment method selection, and checkout button.
- **Regla de total final con propina (rebaseline v2):** en create/update de venta, el total transaccional persiste como `totalBs = subtotal + propina` (y `totalUsd` derivado por tasa). La propina se integra al split de pago del método de captura para mantener invariantes de reparto.
- **Default UX de propina:** al activar `Agregar propina`, el método de captura se inicializa automáticamente con el método principal de pago seleccionado en `CartSheet` para reducir fricción en mobile.
- **Desglose UI:** `CartSheet` mantiene `Subtotal + Propina = Total final`; en cards/listados de ventas, cuando hay propina, se muestra badge dedicado `Propina XBs` (sin repetir el total) para preservar claridad visual.
- **UX pago mixto en CartSheet (actual):** siempre disponible sin depender de toggles en Config. Flujo: seleccionar método principal → activar CTA `Pago mixto` de alto énfasis (objetivo táctil amplio, icono coherente de billetera y texto de apoyo) → elegir método secundario + ingresar monto del split editable. El resumen inferior muestra ambos montos (`Monto método principal` y `Monto método secundario`) con la misma jerarquía visual/microcopy usada en Alquiler para mantener consistencia entre módulos.
- **Hidratación unificada en edición (fix global):** `EditSaleSheet` usa un resolver compartido (`paymentSplitFormHydration`) para derivar método principal/secundario y precargar en el input editable el monto del **método secundario** (según microcopy UX), priorizando el split dominante y sin depender de `paymentMethod` legacy cuando viene desalineado.
- **`WaterMetricsPage` (`src/pages/WaterMetricsPage.tsx`)**: Opens a detailed analytical view of water sales, consolidating statistics like total units sold, total liters dispensed, average sales, and overall total revenue generated.

## 📱 Responsive Core (Phase 3)

- `WaterSalesPage` adopta layout tablet con primitivas responsive (`AppPageContainer` + `TabletSplitLayout`) de forma opt-in.
- En tablet:
  - Flujo vertical en una sola columna: `DateSelector` + card de `PaymentFilter` + barra `Ver carrito` + `SalesList`.
  - El carrito deja de renderizarse como bloque lateral fijo y pasa a jerarquía central entre filtros y registros.
- Guard rail mobile estricto:
  - El FAB de carrito flotante (`fixed bottom-24 left-4`) sigue activo **solo** en `<768px`.
  - No se introducen columnas ni cambios estructurales en mobile.

## 🛡️ Hardening de patrones tablet (Phase 5)

- `WaterSalesPage` consolida clases de layout tablet en tokens compartidos (`src/lib/responsive/tabletLayoutPatterns.ts`) para mantener patrón estable de split/sticky entre módulos.
- Se mantiene inmutable el flujo mobile `<768px` (filtros y listado en stack + FAB/carrito flotante) sin cambios de jerarquía o navegación.
- Auditoría exhaustiva trazable de jerarquía tablet/mobile documentada en `apps/web-app/docs/audits/water-sales-tablet-layout-audit.md` (matriz de evidencia código + pruebas + docs y clasificación de gaps).

## 🔄 Offline Sync Orchestration (hardening)

- El procesamiento de cola offline se controla por feature flags (`src/offline/featureFlags.ts`) con modo resuelto de procesador:
  - `global`: usa orquestador global autoritativo (`src/offline/globalOrchestrator.ts`).
  - `legacy`: mantiene ruta previa para rollout backward-safe.
  - `disabled`: kill switch total (no procesa cola).
- Guardas anti-duplicado: el path global deduplica por `idempotency.key` y evita procesar acciones en vuelo/dependencias no satisfechas.
- Reconciliación de relaciones hija: durante replay global, si una venta offline fue creada con `tempId`, el orquestador sustituye ese `tempId` por el ID real de Supabase antes de insertar `sale_payment_splits`.
- Rollout seguro por defecto: si `GLOBAL_OFFLINE_ORCHESTRATOR` está apagado, la app conserva comportamiento legado salvo que `LEGACY_SYNC_MANAGER_DISABLED` y/o `OFFLINE_QUEUE_PROCESSING_ENABLED` lo bloqueen explícitamente.
- Paridad CRUD offline en ventas: además de `completeSale`, los flujos `updateSale` y `deleteSale` encolan mutaciones `UPDATE/DELETE` para `sales` y reemplazo/eliminación de `sale_payment_splits`, manteniendo estado local optimista y replay consistente al reconectar.
- Política explícita para catálogo `products`: se mantiene **read-sync-only** (sin cola offline de C/U/D desde cliente) para evitar rutas de mutación no soportadas en el scope actual.

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Pricing Calculation:** For products with `requiresLiters === true` (water refills), the price MUST be calculated using `getPriceForLiters(liters)` from the store. Do not use `product.defaultPrice`.
2.  **Currency:** Water sales are primarily conducted in Bolívares (Bs). The USD total is calculated at the end of the transaction by dividing `totalBs` by the `exchangeRate` valid at that exact moment.
3.  **Cart Workflow:** A user can add multiple items to the cart. The `completeSale` action takes the entire `cart` array, calculates the totals, generates a `dailyNumber`, and persists the `Sale` object.
4.  **Supabase Failures:** If a Supabase write fails (create/update/delete), do not update local state as a fallback. Propagate the error so the UI can notify the user.
5.  **Daily Number:** The `dailyNumber` is an incremental integer per day, starting at 1. Ensure it's calculated based on the _normalized_ `sale.date`, not the timestamp.
