# Offline Queue And Sync

> [!IMPORTANT]
> Load this doc when a change enqueues mutations, edits `apps/web-app/src/offline/*`, `SyncManager`, `useSyncStore`, offline feature flags, or the offline behavior of any feature store. The store is used by the real shop: queued items may already exist on a device when new code ships.

## How It Works

- When the browser is offline, store actions apply an optimistic local update and enqueue the Supabase mutation into `useSyncStore` (`src/store/useSyncStore.ts`, persisted).
- Enqueue helpers live in `src/offline/enqueue/*Enqueue.ts`, one per entity (sales, rentals, expenses, customers, machines, prepaid, payment balance, config).
- Shared enqueue building blocks live in the same folder: `tempId.ts` (`generateTempId`, the `temp-<random>` id) and `commonEnqueue.ts` (`enqueueEntityDelete`, used for deletes by id of customers, machines, expenses, prepaid and payment balance). Sales and rentals keep their own deletes.
- Records created offline get a `temp-<random>` id until the queue replays them. When the queue replays an INSERT, `buildSupabaseMutation` replaces any payload field that holds a known temp id with the real one (e.g. a rental's `customer_id`), so a record that references another queued record must declare it in `dependencyKeys` (a rental for a new customer depends on `customer:<temp id>`, and the tip of a new rental or sale depends on that record's INSERT business key via `buildRentalBusinessKey` / `buildSaleCreateBusinessKey`).
- `src/components/layout/SyncManager.tsx` replays the queue when connectivity returns.
- An update or delete of a record that still has a `temp-` id depends on that record's own create through `dependencyKeys` (its `businessKey`). Child rows such as `sale_payment_splits` are enqueued after their parent, and the coverage matrix names each table's dependency group.

## Queue Action Shape (`src/offline/types.ts`)

`GlobalSyncAction` carries `type` (`INSERT | UPDATE | DELETE`), `table`, `payload`, a lifecycle `status`, `schemaVersion`, `idempotency` (`key`, `businessKey`, `payloadFingerprint`), `dependencies`, and `retry` metadata. `SYNC_QUEUE_SCHEMA_VERSION` is 2 and `DEFAULT_SYNC_MAX_ATTEMPTS` is 5.

- `queueMigrations.ts` upgrades persisted legacy actions (`{id, type, table, payload, timestamp}`) to the current shape. Old queued items must keep replaying after any format change.
- `idempotency.ts` builds stable keys and fingerprints so the same action is not applied twice.
- `retryPolicy.ts` classifies errors (409 conflict, 5xx or network codes transient, other 4xx permanent) and retries transient ones with exponential backoff (1s base, 60s cap). Permanent errors are not retried.

## Two Processors, Chosen By Feature Flags

`src/offline/featureFlags.ts` reads `localStorage` flags and `resolveOfflineSyncProcessorMode` returns the active mode:

| Flag (localStorage key)                     | Default |
| :------------------------------------------ | :------ |
| `offline.flag.queue_processing_enabled`     | `true`  |
| `offline.flag.global_orchestrator`          | `false` |
| `offline.flag.legacy_sync_manager_disabled` | `false` |

- Processing disabled (`queue_processing_enabled` off) gives mode `disabled`.
- Otherwise `global_orchestrator` on gives mode `global` (`src/offline/globalOrchestrator.ts`, with `orchestratorMutations.ts`).
- Otherwise mode `legacy`, unless `legacy_sync_manager_disabled` is on. **By default the legacy processor inside `SyncManager.tsx` is the one running.** The global orchestrator is opt-in per device.
- The legacy processor handles `sales` INSERT (plus its splits) itself and sends every other table and action type through `buildSupabaseMutation` (`orchestratorMutations.ts`), sharing a `tempId` to real id map for the run. A failed action only blocks its own `businessKey` and the actions that depend on it; the rest of the queue keeps syncing. After a run with failures it does not retry until the queue size changes or the connection returns again.

Any change to queue semantics must work in both processors, or explicitly state which one it targets.

## Coverage Matrix

`src/offline/coverageMatrix.ts` declares, per table, whether it is `offline-mutation-enabled` or `read-sync-only`, its reconcile requirement, and its dependency group. `read-sync-only` tables are only refreshed on reconnect.

- Mutation-enabled: customers, products (price update only, `enqueueOfflineProductPriceUpdate`), sales, sale_payment_splits, washer_rentals, rental_payment_splits, prepaid_orders, expenses, expense_payment_splits, exchange_rates, liter_pricing, washing_machines, payment_balance_transactions.
- Read-sync-only: companies, user_profiles.
- `rental_shifts` is not in the matrix on purpose: shifts are managed online only (the screen disables every action offline). A rental created offline still carries the snapshot of its shift, taken from the persisted catalog (`useRentalShiftStore`).
- `tips` is enqueued (`rentalsEnqueue.ts`, `salesEnqueue.ts`) but is not listed in the matrix. Add it there if you touch tip queueing.

## Rules For Changes

- Keep enqueue payloads backward compatible. Never change the shape of an action that can already sit in a device's queue without a `queueMigrations.ts` step and a test with the old shape.
- Update the matrix and the matching enqueue helper together when a table gains or loses offline support.
- Offline and online paths of the same action must produce identical records (totals, splits, tips). Tests live next to each store (`*.offlineQueue.test.ts`) and in `src/offline/*.test.ts`.
- Domain contracts per module (customers, prepaid, sales, rentals) are in `apps/web-app/docs/domain-*.md` under "Offline Queue Contract".
- A change touching the queue is a plan-mode change (see `AGENTS.md`, Working Agreement).
