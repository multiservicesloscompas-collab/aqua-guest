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

## Documentation Sync

Update the relevant doc whenever you change:

- Query shape or returned fields
- Mixed-payment persistence behavior
- Financial data-loading assumptions
- RLS or schema expectations used by the frontend
