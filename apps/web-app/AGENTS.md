# AGENTS.md

> [!IMPORTANT]
> This is the entry point for `apps/web-app`. Load only the documents that match the task. Do not read the entire `apps/web-app/docs` tree by default.

> [!IMPORTANT]
> If you change a business rule, persistence contract, domain workflow, or frontend architecture, update the matching documentation file as part of the same task.

## Mission

`apps/web-app` is the active AquaGuest product surface.

Today, the main business workflows live here while the product is still evolving. New code should keep domain boundaries clear so stable modules can later move into `libs/` with minimal rewrites.

## Actual Stack

- React 19 + Vite + TypeScript
- React Router 7
- TailwindCSS + Radix-based UI primitives in `src/components/ui`
- Lucide React icons
- Zustand with multiple feature stores in `src/store/*`, many with persistence
- React Query with IndexedDB persistence for query caching
- Supabase accessed directly from frontend code

## Source Map

| Area | Location | Purpose |
| :--- | :------- | :------ |
| Pages | `src/pages` | Route-level screens and page composition |
| Base UI | `src/components/ui` | Reusable UI primitives and design-system style building blocks |
| Domain UI | `src/components` | Business-facing components grouped by feature |
| Hooks | `src/hooks` | Reusable React behavior and view-model helpers |
| Services | `src/services` | Business logic, formatters, and Supabase-facing workflows kept out of presentational components |
| Stores | `src/store` | Zustand feature stores, store actions, hydration helpers, and orchestration |
| Utilities | `src/lib` | Shared utilities such as Supabase client and persistence helpers |
| Types | `src/types` | Shared TypeScript contracts |

## Domain Context Map

Load only the domain docs needed for the current task.

| Domain | Load This | Keywords |
| :----- | :-------- | :------- |
| Dashboard and global metrics | `apps/web-app/docs/domain-dashboard.md` | KPI, metrics, charts, totals, net profit, dashboard cards |
| Water sales | `apps/web-app/docs/domain-water-sales.md` | liters, bottle sales, cart, checkout, water sale editing |
| Washer rentals | `apps/web-app/docs/domain-rentals.md` | shifts, pickup, delivery, extensions, rental editing |
| Customers | `apps/web-app/docs/domain-customers.md` | customer lookup, autocomplete, directory |
| Finance and configuration | `apps/web-app/docs/domain-finance-config.md` | exchange rate, expenses, payment balance, config |
| Prepaid orders | `apps/web-app/docs/domain-prepaid.md` | prepaid, pending, delivered |
| Transactions and payment summaries | `apps/web-app/docs/domain-transactions.md` | transaction timeline, payment method detail, ledger |
| Cross-module financial dependencies | `apps/web-app/docs/business-logic-dependencies.md` | ripple effects, dashboard impact, mixed payments, tips |
| Mixed payment persistence contract | `apps/web-app/docs/pago-mixto-db-contract.md` | sale splits, rental splits, persistence shape |

## Shared Routing

Load shared docs from the repository root only when the task needs them.

| Topic | Load This | When to Load |
| :---- | :-------- | :----------- |
| Frontend structure and state ownership | `docs/agents/frontend-web-app.md` | React architecture, store boundaries, React Query vs Zustand, UI layering |
| Commercial business rules | `docs/agents/commercial-rules.md` | Any change that can affect totals, payments, tips, expenses, or dashboard calculations |
| Supabase rules | `docs/agents/supabase.md` | Query changes, schema work, persistence, RLS, synchronization |
| Shared architecture | `docs/agents/architecture.md` | Refactors, module extraction, cross-cutting patterns, folder moves |
| AGENTS and agent docs | `docs/agents/agents-guidelines.md` | Before editing `AGENTS.md` or `docs/agents/*` |

## Working Rules

- Do not assume all global state lives in `useAppStore`. The app uses multiple Zustand feature stores under `src/store/*`.
- Use React Query for remote/query-cache concerns when that pattern already exists. Use Zustand for client-side feature state, business flows, and UI coordination.
- Keep business logic in services, hooks, store actions, or mappers rather than inside presentational components.
- Treat `src/components/ui` as the base UI layer. Keep feature-specific composition in `src/components` and `src/pages`.
- When changing Water Sales or Washer Rentals, review impact on dashboard totals, transaction summaries, payment-method summaries, and tip/expense flows.
- Do not introduce Edge Functions. Keep Supabase interactions inside repository code.
- Organize new code so future extraction into `libs/` remains possible.

## Verification

Before finishing a task in `apps/web-app`, verify all of the following:

- Updated the matching domain doc if the task changed business behavior or persistence behavior
- Ran relevant tests for modified files when coverage exists
- Kept files under the 300-line guardrail or refactored them
- Preserved accessibility and responsive behavior when changing UI
