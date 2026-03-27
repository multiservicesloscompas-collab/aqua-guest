# Domain: Customers (Directorio de Clientes)

## 🎯 Business Goal

Maintain a centralized directory of frequent customers to expedite the creation of new washer rentals and prepaid water orders through autocomplete functionality.

## 🗄️ Data Structure (Supabase & Zustand)

### Key Types (`src/types/index.ts`)

- **`Customer`**: `id`, `name`, `phone`, `address`.

### Zustand Store (`src/store/useAppStore.ts`)

- **State:** `customers`.
- **Actions:** `addCustomer`, `updateCustomer`, `deleteCustomer`.

## 🧩 Key UI Components

- **`CustomersPage` (`src/pages/CustomersPage.tsx`)**: The main CRUD interface for managing the customer directory. Supports real-time search filtering.
- **`CustomerSearch` (`src/components/alquiler/CustomerSearch.tsx`)**: A reusable combobox/autocomplete component used primarily in `RentalSheet` to quickly select an existing customer or prompt the creation of a new one.

## ⚙️ Agent Implementation Rules (CRITICAL)

1.  **Customer Linking in Rentals:** When creating a new `WasherRental`, if the user types a new name that doesn't exist in the `customers` table, the `addRental` action in the store MUST automatically create a new `Customer` record in Supabase _before_ creating the rental, ensuring the `customer_id` foreign key is satisfied.
2.  **Denormalization Strategy:** To prevent historical data corruption if a customer changes their phone number or address, the `WasherRental` and `PrepaidOrder` records store a _copy_ of the customer's details (`customerName`, `customerPhone`, `customerAddress`) at the time of the transaction, alongside the `customerId`.
3.  **Search & Autocomplete:** The `CustomerSearch` component filters the `customers` array based on `name`, `phone`, or `address` (case-insensitive).
4.  **Optimistic UI:** When calling `addCustomer`, `updateCustomer`, or `deleteCustomer`, the store updates the local state immediately before the Supabase request. If Supabase fails, the local state MUST remain as a fallback to ensure offline capability or resilience against network issues.
5.  **Required Fields:** Only `name` is strictly required to create a customer. `phone` and `address` are optional but highly recommended for the rental delivery workflow.
6.  **Offline Queue Contract:** When offline, `addCustomer`, `updateCustomer`, and `deleteCustomer` must enqueue `customers` mutations in the global sync queue and apply optimistic local state updates so customer directory changes replay when connectivity returns.
