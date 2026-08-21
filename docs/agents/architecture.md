# Architecture Guide

> [!IMPORTANT]
> Load this doc when changing folder boundaries, shared utilities, module ownership, or planning extraction from `apps/web-app` into `libs/`.

## Goal

Keep AquaGuest flexible while it is still being built, without letting the frontend turn into a permanent monolith.

## Current Topology

| Area | Current Role |
| :--- | :----------- |
| `apps/web-app` | Main product surface and current home of most business workflows |
| `apps/web-app/docs` | Domain-specific documentation for real product behavior |
| `docs/agents` | Cross-cutting rules for architecture, business ripple effects, frontend patterns, and Supabase |
| `libs/*` | Future destination for mature shared domains, reusable services, and stable packages |

## Architectural Rules

- Keep presentational UI, business logic, data access, and state orchestration clearly separated.
- Prefer adding structure that supports later extraction instead of introducing shortcuts that hard-wire features to pages.
- Shared logic should move toward hooks, services, mappers, and feature-local store actions before it moves into `libs/`.
- Frontend-side repository interfaces should live in `libs/product-domain/frontend/{context}/domain`; shared frontend repository contracts such as `BaseRepository` should live in `libs/product-domain/frontend/shared/domain`; concrete adapters such as Supabase implementations should live under the same context's `infrastructure/*` folder.
- For Supabase-backed domain access, establish the repository boundary first: contract in `libs/product-domain/frontend/{context}/domain`, concrete adapter in `{context}/infrastructure/supabase`, and app wiring afterward.
- Infrastructure contracts should be derived from canonical types in `libs/domain` or from the owning context contract in `libs/product-domain/frontend/{context}/domain`. Prefer `extends`, `Pick`, `Omit`, and small shared aliases over repeating property-by-property indexed access. Do not create parallel entity shapes when a row/payload type can be expressed as a persistence-oriented derivative of an existing domain or context type.
- Avoid `snake_case` in internal TypeScript contracts whenever the adapter can alias external fields to camelCase. For Supabase reads, prefer aliased `select` clauses so row types and mappers remain camelCase and close to the canonical domain shape.
- Repository method names should avoid repeating the repository context. Prefer `deleteByOrigin`, `loadHistory`, `loadByDateRange`, etc., instead of names like `deleteTipByOrigin` or `loadExchangeRateHistory`.
- `BaseRepository` should expose `getAll(input?)` rather than `list()`. Shared query contracts such as `GetAllInput`, `WhereField`, and `relations` should live in `libs/product-domain/frontend/shared/domain/query.types.ts`, even if some infrastructure adapters do not support the full shape yet.
- When a repository does not naturally use the table's physical `id` as its public identifier, it may still extend `BaseRepository` with a semantic domain identifier (for example `breakpoint` for liter pricing), as long as the concrete adapter resolves that identifier explicitly at the persistence boundary.
- The shared Supabase adapter under `libs/product-domain/frontend/shared/infrastructure/supabase` currently supports only the minimal `getAll()` contract: root `where.fields`, optional pagination when `limit` is present, and repository-provided simple `relations` select expansion. Do not assume runtime support yet for relation filters, explicit joins, alias-based composition, or `clearAlias` semantics.
- Avoid hidden cross-module dependencies. If Water Sales depends on Dashboard behavior, document that dependency explicitly.
- Keep root `AGENTS.md` high-level. Put detail in focused sub-docs and feature docs.

## Engineering Rules

- Use full TypeScript and preserve type safety end to end. Do not introduce `any`.
- Before creating new code, search for an existing interface, type, helper, service, hook, use case, mapper, or utility that already solves the problem.
- Apply dependency injection when logic depends on external collaborators or side-effectful boundaries.
- Respect SOLID principles so responsibilities stay small and replaceable.
- Keep solutions simple under KISS. Do not create extra layers unless they reduce coupling or clarify ownership.
- Prefer small composable units over oversized multi-purpose modules.
- Use strict TDD by default for behavior changes. Only skip test-first when the task is purely structural or when no reliable test seam exists yet. Keep tests structured as Arrange, Act, Assert.

## When To Extract Into `libs/`

Extraction is a good next step when one or more of these are true:

- A domain concept is reused by multiple modules or workspaces
- The business rules are stable enough to deserve a clear API boundary
- A service, hook family, or type set is becoming difficult to evolve inside `apps/web-app`
- A UI or data contract is shared and no longer belongs to a single page flow

## Refactoring Direction

When a feature grows, prefer this progression:

1. Split large page components into feature components, hooks, and services
2. Group state and business logic by domain under `src/store`, `src/services`, and `src/components`
3. Extract stable shared contracts or logic into `libs/` only after boundaries are clear

## Guardrails

- Keep files under 300 lines of code
- Do not duplicate business rules across pages and stores
- When a canonical entity has app-only presentation fields, keep the canonical shape in `libs/domain` and compose app-local extension types instead of moving UI metadata into domain
- Update the matching docs when you establish a new architectural pattern
