# Workflow And Release Safety

> [!IMPORTANT]
> Production is `origin/main` and a merge deploys it automatically. There is no staging environment and one developer. Every rule here exists to keep each deploy small, verifiable, and revertable.

Load this doc for bug fixes, refactors, migrations, releases, or when triaging failing tests.

## Consent (hard stops)

Ask the user, every time and for that specific action, before you:

- run `git commit`, `git push`, open or merge a PR
- reset, seed, or migrate a database, or run any e2e spec or command: the suite wipes and reseeds the local database before every test
- delete files the task did not create, or touch anything outside the repository

Approval of one action never extends to the next one. Prefer leaving changes uncommitted and summarizing the diff.

## Environments

- Development and e2e use only the local Supabase stack (`127.0.0.1`, `npm run supabase:start`). The e2e support code aborts if the URL is not local. Never bypass that guard.
- Every e2e test starts from an empty database plus a fixed baseline (`apps/web-app-e2e/src/support/reset`). `npm run e2e:reset`, `npm run e2e:purge` and `npm run e2e:reset:dry` do the same from the command line.
- Cross-module e2e scenarios are data (`apps/web-app-e2e/src/support/scenarios`); their expected dashboard figures come from `support/ledger`, which must never copy the app's formulas. Prepaid orders and rental extensions are intentionally out of scope.
- Every e2e test is written with `documented({intent, steps, expects})` (Spanish text, exact figures) and asserts toasts through `expectToast`, never a bare `getByText`. `npm run e2e:live -- --check` enforces the ficha.
- `supabase/` is versioned. The first two migrations mirror the production baseline (`initial_schema` + USD balance columns) and are not proof of the real production schema.
- Production migrations are applied by the user with `npm run db:migrate`. Never assume they were applied: `npm run db:migrations:status` lists them, and the app warns on startup when some are pending (`docs/agents/supabase.md`, Migrations).

## Bug Fix Flow (one bug at a time)

1. **Red:** write `apps/web-app-e2e/src/tests/bugs/<id>-<slug>.bugs.e2e.spec.ts` (AAA, asserts the correct behavior, documented with `bugDoc({ id, ... })`) plus a `.md` next to it: user action, expected, actual, root cause. Add the id to `BUG_KNOWLEDGE` in `support/bugs/bugKnowledge.ts` (cause, fix, where): `bugDoc` will not compile without it, and `npm run e2e:bugs -- --check` fails if any is empty. Do not touch `apps/web-app/src`. Confirm it fails on the business assertion, not on a selector or timeout.
2. **Stop.** Give the user the run command (`npm run e2e:bugs -- --id <ID>`: visible browser, stops on the failing screen, explains why it fails and what to fix) and wait for confirmation that they saw the failure.
3. **Fix:** add a failing Vitest unit test, make the minimal source change, then the e2e must pass. Move the spec to `tests/regression/`.
4. Run the checks below, report real numbers, and ask before committing.

## Refactor Flow (behavior-preserving)

- Write a characterization test first and list what must stay identical: query columns, filters, ordering, limits, error handling, cache semantics.
- A refactor PR never changes behavior. If a behavior change is needed, ship it as its own PR.
- `refactor/create-domain` is reference material only. Reimplement on top of `origin/main`; never cherry-pick its commits (it hides regressions such as default ordering, dropped date buckets, and mandatory `payment_kind`).

## Database Changes

- Expand first: additive columns and tables with defaults, deployed before any code that reads them.
- Every migration ships with its rollback SQL.
- Never rewrite existing data in the same release that changes the code reading it.
- Never grant `FOR ALL TO public USING (true)` on new tables without an explicit user decision.

## Test Triage

- A red test is either a real bug or a stale test. Say which one, with evidence (git history of code vs test).
- Never edit an assertion to match today's output without writing down the business rule it now encodes.
- Known bugs are marked `it.fails` with the bug id in a comment, and flipped back when fixed.
- Baseline for `nx test web-app`, `typecheck`, `lint`, and `build` must not get worse. Report the actual failure count when closing a task.

## Money Invariants

- Historic amounts use the amount and rate stored on the record (`paymentSplits`, `exchangeRateUsed`), never today's exchange rate.
- On edit with a tip, stores receive principal-only totals and splits (see `commercial-rules.md`).
- Any change to sales, rentals, splits, tips, or expenses is checked against dashboard totals, transactions, payment-method detail, tips, and expenses.

## Release

- One PR = one behavior, deployable alone. After a merge wait 4-5 hours for reports before shipping the next.
- Rollback is `git revert -m 1 <merge>` and push. Packages with a migration must also have their SQL rollback ready.

## Checks

```bash
npx nx test web-app
npx nx typecheck web-app
npx nx lint web-app
npx nx build web-app
npm run e2e:web-app      # regression e2e against the local DB
npm run e2e:reset        # wipe the local DB and seed the e2e baseline
npm run e2e:live         # interactive runner: per-test fichas (what it does, what it expects), watch them run
npm run e2e:live -- --check   # fails if any e2e test lacks a complete documented() ficha
npm run e2e:bugs         # interactive bug runner: objective, why it fails, what to fix; browser visible
npm run e2e:bugs:ci      # same specs, plain Playwright run (CI, agents)
```
