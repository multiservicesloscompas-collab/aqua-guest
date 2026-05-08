# Frontend Web-App Guide

> [!IMPORTANT]
> Load this doc when working on React structure, UI composition, Zustand stores, React Query usage, or frontend refactors inside `apps/web-app`.

## Stack Snapshot

- React 19 + Vite + TypeScript
- React Router 7
- TailwindCSS for styling
- Radix-based primitives under `src/components/ui`
- Zustand feature stores under `src/store/*`
- React Query with persistent cache for query/server state
- Supabase accessed directly from frontend code

## State Ownership

Use the smallest state tool that matches the problem.

- Local component state: ephemeral UI state such as open or closed sections, temporary input state, or purely visual interactions
- Zustand: client-side feature state, cross-component workflow state, persisted user-facing state, and business-flow coordination
- React Query: async remote data lifecycles, caching, invalidation, and persistence of query-backed data

Do not force all state into a single global store. AquaGuest already uses multiple feature stores.

## Engineering Discipline

- Write full TypeScript and maintain strict type safety. Do not use `any`.
- Search for existing interfaces, types, helpers, hooks, store actions, services, and components before writing new code.
- Reuse existing code when it fits instead of creating near-duplicates.
- Apply dependency injection when a service, hook, or use case depends on external collaborators, storage, or network boundaries.
- Respect SOLID while staying practical.
- Prefer the simplest correct implementation under KISS.

## Testing Workflow

- Default to TDD when implementing new behavior or fixing bugs.
- Use the existing workspace testing stack rather than adding a new one. In `apps/web-app`, this means Vitest and Testing Library with Jest-style assertions and structure.
- Write tests using Arrange, Act, Assert.
- When modifying behavior that already has tests, update or extend those tests before or alongside the implementation.
- When adding new logic, first check whether a nearby test file already covers the surrounding unit or workflow.

## Layering Rules

- `src/components/ui` is the base UI layer. Keep it generic and reusable.
- `src/components` should contain domain-specific composition.
- `src/pages` should orchestrate screens, not absorb business logic.
- `src/services` should hold business rules, formatting logic, and Supabase-facing workflows that do not belong in JSX.
- `src/hooks` should capture reusable view-model or interaction behavior.
- `src/store` should own feature store state, actions, and hydration logic.

## Implementation Bias

- Prefer small, explicit components over oversized page files.
- Do not add memoization by reflex. Introduce `useMemo` or `useCallback` only for real expensive work or stable callback requirements.
- Preserve responsive behavior and accessible semantics when editing UI.
- Keep feature logic close to the feature until reuse or stability makes extraction obvious.

## Documentation Sync

If you change business behavior, frontend architecture, or a persistence-facing workflow, update the matching file in `apps/web-app/docs` or `docs/agents` in the same task.
