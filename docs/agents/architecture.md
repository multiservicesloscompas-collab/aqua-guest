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
- Avoid hidden cross-module dependencies. If Water Sales depends on Dashboard behavior, document that dependency explicitly.
- Keep root `AGENTS.md` high-level. Put detail in focused sub-docs and feature docs.

## Engineering Rules

- Use full TypeScript and preserve type safety end to end. Do not introduce `any`.
- Before creating new code, search for an existing interface, type, helper, service, hook, use case, mapper, or utility that already solves the problem.
- Apply dependency injection when logic depends on external collaborators or side-effectful boundaries.
- Respect SOLID principles so responsibilities stay small and replaceable.
- Keep solutions simple under KISS. Do not create extra layers unless they reduce coupling or clarify ownership.
- Prefer small composable units over oversized multi-purpose modules.
- When behavior changes, write or update tests first when feasible and keep tests structured as Arrange, Act, Assert.

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
- Update the matching docs when you establish a new architectural pattern
