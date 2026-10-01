# Supabase Guide

> [!IMPORTANT]
> Load this doc when changing Supabase queries, persistence flows, tables, RLS, synchronization behavior, or data-loading contracts.

## Current Model

AquaGuest talks to Supabase directly from repository code.

- No Supabase Edge Functions
- No database-side business logic by default
- No logic moved outside the codebase unless the user explicitly requests an architecture change
- Load `docs/agents/database.md` when the task needs the current schema inventory, table relationships, enum-like constraints, or managed-schema context

## Data Access Rules

- Keep Supabase access inside repository code such as `src/lib`, `src/services`, store actions, or closely related feature code.
- Keep persistence contracts explicit. If a table shape or join contract changes, update the related documentation.
- Use task-appropriate error handling around Supabase calls and keep failure paths visible to the UI.
- When changing mixed-payment persistence, also load `apps/web-app/docs/pago-mixto-db-contract.md`.

## Query And Schema Changes

- Prefer the smallest safe change that preserves existing flows.
- Validate downstream impact on dashboard totals, transaction summaries, and payment-method summaries when changing financial tables.
- Treat RLS, filters, and joins as part of product behavior, not as isolated infrastructure details.

## Security Rules

- Never expose credentials or `.env` contents in documentation, logs, or responses.
- Keep authentication and authorization changes explicit and reviewable.

## Local Development Workflow

- Run `npm run local` to spin up the local Supabase container stack and launch the web app with local configuration.
- Local endpoints:
  - **Supabase Studio:** `http://127.0.0.1:54323`
  - **REST API:** `http://127.0.0.1:54321/rest/v1`
  - **PostgreSQL Database:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Management scripts:
  - `npm run supabase:start`: Starts local Supabase stack in background.
  - `npm run supabase:stop`: Stops local Supabase containers.
  - `npm run supabase:status`: Prints local endpoints and keys.
  - `npm run supabase:reset`: Resets the local database and re-applies `supabase/migrations` and `supabase/seed.sql`. Destructive: needs the user's approval.
  - `npm run db:migrations:status`: Lists which migrations are applied and which are pending (`supabase migration list`).
  - `npm run db:migrate`: Applies the pending migrations to the linked remote project (`supabase db push`) and records them in the registry.

## Migrations

- `supabase/` is versioned (`config.toml`, `migrations/`, `seed.sql`). Never commit `supabase/.temp`, `.branches` or `.env*` (already ignored by `supabase/.gitignore`).
- One file per change: `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`, additive first, with the rollback SQL as a comment at the top (`docs/agents/workflow.md`, Database Changes).
- The registry is Supabase's own `supabase_migrations.schema_migrations`. `npm run local` runs `supabase migration up` before serving, so local databases never fall behind.
- On startup the app compares the versions found in `supabase/migrations` at build time (`__EXPECTED_MIGRATIONS__`, injected in `apps/web-app/vite.config.mts`) with the database (`public.applied_migration_versions()`), and shows a 15 second warning toast once per session when some are pending (`useMigrationToast`, called by the Dashboard). The browser never applies migrations; the user runs `npm run db:migrate`.
- Step-by-step guide for the user (local and production, with credentials): `supabase/README.md`.
- One-time production setup: `npx supabase login`, `npx supabase link --project-ref <ref>`, then `npx supabase migration repair --status applied 20260101000000 20260717120000` for the two migrations that were applied by hand before the registry existed.
- Before merging a PR that adds a migration, apply it to production first (expand first), so the deployed app never shows the banner.

## Documentation Sync

Update the relevant doc whenever you change:

- Query shape or returned fields
- Mixed-payment persistence behavior
- Financial data-loading assumptions
- RLS or schema expectations used by the frontend
