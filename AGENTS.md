# AGENTS.md

> [!IMPORTANT]
> This is the root router for AquaGuest. Load only the nearest `AGENTS.md` and the smallest set of supporting docs needed for the current task. Do not read the whole documentation tree by default.

## Project Mission

AquaGuest is evolving into a modular, configurable management system for small businesses.

Current commercial modules:

- Water sales
- Washer rentals

The codebase should be shaped so these modules can be extracted into `libs/` later without rewriting core business rules.

## Quick Commands

```bash
# Local development (starts Supabase stack + web-app)
npm run local

# Web App
npx nx serve web-app
npx nx build web-app
npx nx test web-app
npx nx lint web-app
npx nx typecheck web-app

# Supabase Local
npm run supabase:start
npm run supabase:stop
npm run supabase:status
npm run supabase:reset
```

## Project Map

| Area | Location | Purpose |
| :--- | :------- | :------ |
| Frontend app | `apps/web-app` | Main React + Vite application and current product surface |
| Frontend domain docs | `apps/web-app/docs` | Business-domain reference for dashboard, water sales, rentals, finance, prepaid, and transactions |
| Shared agent docs | `docs/agents` | Cross-cutting routing docs for architecture, business rules, frontend patterns, and Supabase |
| Future shared modules | `libs/*` | Target location for stable domain logic, shared services, and reusable packages |

## Operating Mindset

- Think like a software architect, not a ticket processor.
- Challenge coupling, hidden side effects, and changes that make future modularization harder.
- Keep root guidance high-level and task routing focused.
- When a pattern changes, update the relevant agent documentation as part of the same task.

## Non-Negotiable Rules

- Keep files under 300 lines of code. If a change pushes a file beyond that limit, refactor before continuing.
- Never print, log, or expose `.env` contents or credentials.
- Do not introduce Supabase Edge Functions or database-side business logic unless the user explicitly requests an architecture change.
- Keep business logic out of presentational UI components whenever practical.
- Prefer module boundaries that make future extraction into `libs/` straightforward.

## Working Agreement

- **Consent:** never commit, push, open or merge a PR, reset or migrate a database, or run data-purging e2e without the user's explicit approval for that specific action. Approval does not carry over to the next action. Details in `docs/agents/workflow.md`.
- **Production is `origin/main`.** A merge deploys it. Keep every change small, single-purpose, and revertable.
- **Local data only:** development and e2e run against local Supabase (`127.0.0.1`), never a remote database.
- **Bugs:** red e2e first, the user confirms the failure, then fix. One bug at a time.
- **Refactors preserve behavior** and never share a PR with a behavior change. `refactor/create-domain` is reference only, never cherry-picked.
- **Failing tests:** say whether it is a bug or a stale test. Never change an assertion to match current output without stating the business rule.
- **Money:** never recompute historic amounts with today's exchange rate; use the values stored on the record.
- **Ask only what is the user's to decide** (business rules, destructive or external actions, priorities). Decide the rest and say what you chose. When a real trade-off exists, give one recommendation with its reason.
- **Use plan mode** for changes that touch money, the database, the offline queue, or more than one module.
- **Scope:** note improvements you notice outside the task and propose them; do not implement them unasked.
- **Report faithfully:** failing checks with their real output, skipped steps as skipped, and mistakes as mistakes.
- **Language:** chat replies in Spanish; code, docs, and commits in English.

## Engineering Standards

- Write full TypeScript and keep code type-safe. Do not use `any`.
- Prefer existing interfaces, types, helpers, hooks, services, use cases, and other reusable code before creating new abstractions.
- Use dependency injection for services, use cases, and other logic that depends on external collaborators.
- Respect SOLID principles, but keep the implementation simple and pragmatic under KISS.
- Avoid duplication. Search the codebase first and reuse what already exists when it fits the task.
- Default to TDD: a unit test first for new behavior, a red e2e for bug fixes, and a characterization test for refactors.
- Structure tests with the Arrange, Act, Assert pattern.
- For this repository, the expected test runner is the one already used by the target workspace. In `apps/web-app`, write and run Jest-style unit tests using the existing Vitest stack instead of introducing a second test framework.

For this repository, the phrase `commercial modules` means the Water Sales and Washer Rentals modules. Their cross-module financial impact is documented in `docs/agents/commercial-rules.md`.

## Local Skills

- If your agent supports skill loading, activate only the skills needed for the task.
- Project-local skills live under `.agents/`. Route your skill loader there when task-specific guidance is needed.
- Suggested mapping:
  - React, rendering, UI, UX: React or web-design related skills
  - Supabase, SQL, schema, RLS: Supabase or Postgres related skills
  - Documentation authoring: agent-documentation or AGENTS-related skills

## Task Routing

| Task Category | Load This | When to Load |
| :------------ | :-------- | :----------- |
| Frontend product work | `apps/web-app/AGENTS.md` | Any task touching `apps/web-app` code, routes, components, stores, services, or frontend docs |
| Shared architecture and modularization | `docs/agents/architecture.md` | Changing folder boundaries, extracting shared logic, planning `libs/`, or reviewing coupling |
| Commercial rules and financial ripple effects | `docs/agents/commercial-rules.md` | Editing water sales, rentals, mixed payments, tips, dashboard totals, expenses, or transaction summaries |
| Frontend architecture and state patterns | `docs/agents/frontend-web-app.md` | Working on React structure, Zustand, React Query, UI composition, or frontend layering |
| Supabase data access and persistence rules | `docs/agents/supabase.md` | Working on queries, tables, RLS, data hydration, synchronization, or persistence contracts |
| Database schema reference | `docs/agents/database.md` | Inspecting current tables, relationships, enums, constraints, or Supabase-managed schemas before changing the database |
| Offline queue and sync | `docs/agents/offline-sync.md` | Anything that enqueues mutations, changes `src/offline/*`, `SyncManager`, feature flags, or offline behavior of a store |
| Bug, refactor, migration, release, and test-triage workflow | `docs/agents/workflow.md` | Fixing a bug, refactoring, touching migrations, preparing a release, or investigating failing tests |
| Testing discipline and workflow | `docs/agents/frontend-web-app.md` | Writing or updating frontend tests, enforcing TDD, AAA, or reuse-first implementation in `apps/web-app` |
| AGENTS maintenance | `docs/agents/agents-guidelines.md` | Before editing any `AGENTS.md` or files inside `docs/agents/` |

## Definition Of Done

Before finishing, verify all of the following:

- Loaded the nearest `AGENTS.md` plus only the supporting docs required for the task
- Updated affected agent docs when business rules or architectural patterns changed
- Preserved module boundaries and future extraction paths into `libs/`
- Kept edited files under the 300-line guardrail
- Ran relevant Nx checks or clearly explained why a check was not run, and reported real failure counts
- Left commits, pushes, and database changes to the user's explicit approval
- Reviewed cross-module impact when touching Water Sales or Washer Rentals
