# Database Reference

> [!IMPORTANT]
> Load this doc when a task needs the current database shape: tables, relationships, schema ownership, enum-like constraints, or Supabase-managed schemas.

## Purpose

This file is the repository-side reference for what currently lives in the AquaGuest Supabase database.

- Use this before adding or changing tables, columns, joins, or constraints.
- Prefer this doc over ad-hoc MCP schema reads for routine product work.
- If the real database changes, update this file in the same task.

## Schema Overview

| Schema | Owner | What Lives There |
| :----- | :---- | :---------------- |
| `public` | AquaGuest app domain | Product tables used by the app |
| `auth` | Supabase-managed | Authentication users, sessions, identities, MFA, OAuth, SSO |
| `storage` | Supabase-managed | File bucket and object metadata for Supabase Storage |
| `realtime` | Supabase-managed | Realtime subscriptions and replication support tables |
| `vault` | Supabase-managed extension | Encrypted secrets stored through Supabase Vault |
| `supabase_migrations` | Supabase-managed | Migration bookkeeping |

## Working Rule

- Treat `public` as the main app schema.
- Treat `auth`, `storage`, `realtime`, `vault`, and `supabase_migrations` as platform-managed unless there is an explicit architecture reason to depend on them.
- Supabase documentation warns that managed schemas like `auth` and `storage` may change to support platform features, so app-domain data should generally live in `public`.

## Public Tables

### `customers`
Customer registry used by washer rentals.

- PK: `id uuid`
- Core fields: `name`, `phone`, `address`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`
- Real relationships:
  - Referenced by `washer_rentals.customer_id`

### `sales`
Water-sale header records.

- PK: `id uuid`
- Core fields: `daily_number`, `date`, `items jsonb`, `payment_method`, `total_bs`, `total_usd`, `exchange_rate`, `notes`, `temp_id`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`
- Real relationships:
  - Parent of `sale_payment_splits.sale_id`
- Implicit relationships:
  - Can be referenced by `tips` when `tips.origin_type = 'sale'`

### `washer_rentals`
Washer-rental transactions.

- PK: `id uuid`
- Core fields: `date`, `customer_id`, `machine_id`, `shift`, `delivery_time`, `pickup_time`, `pickup_date`, `delivery_fee`, `total_usd`, `payment_method`, `status`, `date_paid`, `notes`, `is_paid`
- Agenda send fields: `agenda_template_send_state`, `agenda_template_sent`, `agenda_template_sent_at`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`
- Real relationships:
  - `customer_id -> customers.id`
  - Parent of `rental_payment_splits.rental_id`
- Implicit relationships:
  - `machine_id` behaves like a logical link to `washing_machines.id`, but no FK is currently present
  - Can be referenced by `tips` when `tips.origin_type = 'rental'`

### `expenses`
Expense header records.

- PK: `id uuid`
- Core fields: `date`, `description`, `amount`, `category`, `payment_method`, `notes`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`
- Real relationships:
  - Parent of `expense_payment_splits.expense_id`

### `washing_machines`
Washer catalog.

- PK: `id int4`
- Core fields: `name`, `kg`, `brand`, `status`, `is_available`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`
- Notes:
  - `id` uses a sequence, not UUID
  - No FK from `washer_rentals.machine_id` is enforced today

### `products`
Saleable product catalog for water sales.

- PK: `id uuid`
- Core fields: `name`, `default_price`, `min_liters`, `max_liters`, `requires_liters`, `icon`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`

### `prepaid_orders`
Prepaid water-order records.

- PK: `id uuid`
- Core fields: `customer_name`, `customer_phone`, `liters`, `payment_method`, `date_paid`, `date_delivered`, `notes`, `amount_bs`, `amount_usd`, `exchange_rate`, `status`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`

### `liter_pricing`
Pricing breakpoints by liters.

- PK: `id uuid`
- Core fields: `breakpoint`, `price`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`

### `exchange_rates`
Exchange-rate history.

- PK: `id uuid`
- Core fields: `date`, `rate`
- Constraints:
  - `date` is unique
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`

### `payment_balance_transactions`
Payment-balance transfers and adjustments across payment methods.

- PK: `id uuid`
- Core fields: `date`, `from_method`, `to_method`, `amount`, `amount_bs`, `amount_usd`, `amount_in_bs`, `amount_out_bs`, `difference_bs`, `notes`, `operation_type`
- Lifecycle fields: `created_at`, `updated_at`, `deleted_at`

### `sale_payment_splits`
Mixed-payment detail rows for water sales.

- PK: `id uuid`
- Real relationships:
  - `sale_id -> sales.id`
- Core fields: `payment_method`, `amount_bs`, `amount_usd`, `exchange_rate_used`
- Lifecycle fields: `created_at`, `updated_at`

### `rental_payment_splits`
Mixed-payment detail rows for washer rentals.

- PK: `id uuid`
- Real relationships:
  - `rental_id -> washer_rentals.id`
- Core fields: `payment_method`, `amount_bs`, `amount_usd`, `exchange_rate_used`
- Lifecycle fields: `created_at`, `updated_at`

### `expense_payment_splits`
Mixed-payment detail rows for expenses.

- PK: `id uuid`
- Real relationships:
  - `expense_id -> expenses.id`
- Core fields: `payment_method`, `amount_bs`, `amount_usd`, `exchange_rate_used`
- Lifecycle fields: `created_at`, `updated_at`

### `tips`
Tip records captured from sales or rentals, with payout tracking.

- PK: `id uuid`
- Core fields: `origin_type`, `origin_id`, `tip_date`, `amount_bs`, `amount_usd`, `exchange_rate_used`, `capture_payment_method`, `paid_payment_method`, `paid_at`, `notes`, `status`
- Lifecycle fields: `created_at`, `updated_at`
- Implicit relationships:
  - `origin_type = 'sale'` means `origin_id` points to `sales.id`
  - `origin_type = 'rental'` means `origin_id` points to `washer_rentals.id`
- Notes:
  - This is a polymorphic reference implemented in app logic, not with DB FKs

### `tip_payout_idempotency`
Idempotency bookkeeping for tip payout flows.

- PK: `id uuid`
- Core fields: `idempotency_key`, `scope`, `payment_method`, `tip_id`, `tip_date`, `paid_count`, `total_amount_bs`
- Lifecycle fields: `created_at`, `updated_at`
- Constraints:
  - `idempotency_key` is unique
- Implicit relationships:
  - `tip_id` looks like a logical link to `tips.id`, but no FK is currently present

## Relationship Map

Real foreign keys in `public`:

- `washer_rentals.customer_id -> customers.id`
- `sale_payment_splits.sale_id -> sales.id`
- `rental_payment_splits.rental_id -> washer_rentals.id`
- `expense_payment_splits.expense_id -> expenses.id`

Important implicit relationships without FK enforcement:

- `washer_rentals.machine_id -> washing_machines.id`
- `tips.origin_type + tips.origin_id -> sales.id | washer_rentals.id`
- `tip_payout_idempotency.tip_id -> tips.id`

## Enum And Constraint Reference

There are no custom Postgres enums in `public` right now. Most constrained value sets are implemented with `CHECK` constraints on `text` columns.

Shared payment-method set used across split and tip tables:

- `efectivo`
- `pago_movil`
- `punto_venta`
- `divisa`

Current constrained value sets in `public`:

| Table.Column | Allowed Values |
| :----------- | :------------- |
| `sale_payment_splits.payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` |
| `rental_payment_splits.payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` |
| `expense_payment_splits.payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` |
| `tips.capture_payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` |
| `tips.paid_payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` or `NULL` |
| `tips.origin_type` | `sale`, `rental` |
| `tips.status` | `pending`, `paid` |
| `tip_payout_idempotency.scope` | `single`, `day` |
| `tip_payout_idempotency.payment_method` | `efectivo`, `pago_movil`, `punto_venta`, `divisa` |
| `washer_rentals.agenda_template_send_state` | `not_sent`, `sending`, `sent` |

Current numeric guards in `public`:

- `*_payment_splits.amount_bs >= 0`
- `*_payment_splits.amount_usd IS NULL OR >= 0`
- `*_payment_splits.exchange_rate_used IS NULL OR > 0`
- `tips.amount_bs >= 0`
- `tips.amount_usd IS NULL OR >= 0`
- `tips.exchange_rate_used IS NULL OR > 0`

## Cross-Table Patterns

- Most domain tables use `id`, `created_at`, `updated_at`, and often `deleted_at` for soft delete.
- Many business dates are stored as `text` instead of `date` or `timestamptz`.
- Mixed payments are modeled in dedicated split tables instead of JSON inside parent rows.
- Tips are stored separately from parent transactions and linked back by app logic.
- RLS is currently enabled on all listed `public` tables.

## Supabase-Managed Schemas

These schemas were not created by AquaGuest business-domain modeling. They exist because Supabase features create and manage them.

### `auth`

What it is: Supabase Auth's schema.

- Contains users, sessions, identities, refresh tokens, MFA, OAuth, and SSO tables
- Current tables include `users`, `sessions`, `identities`, `refresh_tokens`, `mfa_factors`, `oauth_clients`, and more
- Current Postgres enums include values like auth assurance level, MFA factor types, and OAuth status
- Use case: authentication platform data, not app-domain records

### `storage`

What it is: Supabase Storage's metadata schema.

- Contains bucket and object metadata such as `buckets`, `objects`, multipart upload tables, and vector bucket support tables
- Current Postgres enum: `buckettype = STANDARD | ANALYTICS | VECTOR`
- Use case: metadata for files stored through Supabase Storage, not your product domain tables

### `realtime`

What it is: Supabase Realtime's internal schema.

- Contains tables such as `subscription`, `messages`, and `schema_migrations`
- Current Postgres enums include replication actions and equality operators
- Use case: track subscriptions and internal realtime infrastructure

### `vault`

What it is: Supabase Vault extension schema.

- Contains `vault.secrets`
- Stores encrypted secrets managed through the database extension
- Use case: secret storage, not business-domain entities

### `supabase_migrations`

What it is: migration bookkeeping schema.

- Contains `schema_migrations`
- Use case: Supabase migration history tracking

## Practical Guidance

- Add new AquaGuest business tables to `public` unless there is a strong reason not to.
- Do not model product features by writing business data into `auth`, `storage`, `realtime`, or `vault`.
- If app code needs user-related domain data, prefer a `public` table that references or mirrors `auth.users` rather than treating `auth` as your primary domain schema.
- If a migration adds a new constrained value set, document whether it is a real enum or a `CHECK`-backed text field.

## Maintenance Rule

When schema changes land, update this file with:

- New or removed tables
- New columns that change persistence contracts
- New real or implicit relationships
- New enums or `CHECK`-based value sets
- New Supabase-managed features that introduce platform tables the team should understand
