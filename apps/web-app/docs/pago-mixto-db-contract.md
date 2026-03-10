# Pago Mixto — Supabase DB Contract (Handoff)

## Objetivo

Definir el contrato mínimo de persistencia para pagos mixtos en Agua y Alquiler sin romper compatibilidad con columnas legacy `payment_method`.

## Tablas nuevas

### 1) `sale_payment_splits`

- `id` uuid pk default `gen_random_uuid()`
- `sale_id` uuid not null references `sales(id)` on delete cascade
- `payment_method` text not null check in (`efectivo`,`pago_movil`,`punto_venta`,`divisa`)
- `amount_bs` numeric(12,2) not null check (`amount_bs >= 0`)
- `amount_usd` numeric(12,2) null check (`amount_usd is null or amount_usd >= 0`)
- `exchange_rate_used` numeric(12,4) null check (`exchange_rate_used is null or exchange_rate_used > 0`)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Índices recomendados:

- `idx_sale_payment_splits_sale_id` on (`sale_id`)
- `idx_sale_payment_splits_method` on (`payment_method`)

### 2) `rental_payment_splits`

- `id` uuid pk default `gen_random_uuid()`
- `rental_id` uuid not null references `washer_rentals(id)` on delete cascade
- `payment_method` text not null check in (`efectivo`,`pago_movil`,`punto_venta`,`divisa`)
- `amount_bs` numeric(12,2) not null check (`amount_bs >= 0`)
- `amount_usd` numeric(12,2) null check (`amount_usd is null or amount_usd >= 0`)
- `exchange_rate_used` numeric(12,4) null check (`exchange_rate_used is null or exchange_rate_used > 0`)
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Índices recomendados:

- `idx_rental_payment_splits_rental_id` on (`rental_id`)
- `idx_rental_payment_splits_method` on (`payment_method`)

## Compatibilidad legacy

- `sales.payment_method` y `washer_rentals.payment_method` se mantienen durante rollout.
- Para nuevas escrituras split-aware, `payment_method` se deriva del split dominante (mayor `amount_bs`, desempate por orden alfabético del método).

## Regla de integridad por transacción

Se recomienda check transaccional en capa aplicación + validación DB diferida:

- `sum(amount_bs)` por `sale_id` == `sales.total_bs`
- `sum(amount_bs)` por `rental_id` == `washer_rentals.total_usd * exchange_rate_used` (o tipo de cambio del cierre)

En esta fase, la validación fuerte vive en frontend (helpers de split validation) y la migración SQL puede introducir constraints gradualmente.

## Contrato frontend

El frontend compila contra:

- `apps/web-app/src/services/payments/paymentSplitSchemaContract.ts`
- `apps/web-app/src/services/payments/paymentSplitSupabaseAdapters.ts`

Ambos reflejan nombres de tablas/columnas esperados para el rollout.
