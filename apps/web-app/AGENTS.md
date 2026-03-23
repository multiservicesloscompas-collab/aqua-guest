# AquaGest - Frontend Agent Guidelines

This is your **ENTRY POINT** for working on the `apps/web-app` project.

**CRITICAL CONSTRAINT - CONTEXT ISOLATION:**
STOP. DO NOT read all documents in the `docs/` folder. Doing so will bloat your context window and degrade performance. **ONLY read the specific domain file listed below that matches your current task.**

**DOCUMENTATION MAINTENANCE MANDATE:**
If you implement a new feature, change a business rule (e.g., pricing logic, status flow, scheduling rules), or alter the frontend architecture, **YOU MUST update the corresponding domain `.md` file** in `apps/web-app/docs/` as part of your changes to keep the agentic knowledge base synchronized.

---

## 🗺️ Domain Context Map (Agent Navigation)

Identify the domain of your task and read **ONLY** the linked file to get the specific business rules, components, and state management logic.

- **📊 Dashboard & Global Metrics:** Read `apps/web-app/docs/domain-dashboard.md`
  - _Keywords:_ KPI, daily income, MTD, gross/net profit, charts, payment method totals, `DashboardPage`, `DashboardMetricsService`.
- **💧 Water Sales & Cart (Agua):** Read `apps/web-app/docs/domain-water-sales.md`
  - _Keywords:_ Liters pricing, water refills, bottles, cart, `CartSheet`, `addSale`.
- **🌀 Washer Rentals & Scheduling (Lavadoras):** Read `apps/web-app/docs/domain-rentals.md`
  - _Keywords:_ Rental shifts (medio, completo, doble), pickup time calculation, extensions, tracking, delivery fee, `WasherRental`, `FollowUpPage`.
- **👥 Customers (Clientes):** Read `apps/web-app/docs/domain-customers.md`
  - _Keywords:_ Customer directory, autocomplete, `CustomerSearch`, `CustomersPage`.
- **💰 Finance, Exchange Rates & Expenses (Finanzas):** Read `apps/web-app/docs/domain-finance-config.md`
  - _Keywords:_ Dashboard metrics, exchange rate (`exchangeRate`), expenses (`Expense`), balance transfers (Equilibrio de pagos), `ConfigPage`.
- **📦 Prepaid Orders (Prepagados):** Read `apps/web-app/docs/domain-prepaid.md`
  - _Keywords:_ Paid in advance, pending/delivered status, `PrepaidOrder`, `PrePaysPage`.

## 🧾 Definiciones de Modulos Comerciales (Regla de Dominio)

- Cuando el usuario mencione "modulos comerciales", se refiere explicitamente a:
  - Modulo de "Alquiler de lavadoras"
  - Modulo de "Ventas de agua"
- Cualquier record nuevo o modificacion de records en estos modulos puede afectar multiples submodulos o partes de la app, incluyendo:
  - Dashboard en metricas generales
  - Resumen de pagos por tipo de pago
  - Transacciones generales
  - Transacciones por tipo de pago
- Reglas especiales para pagos y propinas:
  - Si el pago es mixto, distribuir y reflejar los montos correctamente por tipo de pago
  - Las propinas impactan el modulo de Propinas
  - Las propinas impactan el modulo de Egresos solo cuando la propina esta pagada

---

## 🛠️ Global Tech Stack & Tools

- **Framework:** React 19 + Vite + TypeScript.
- **State Management:** Zustand (with persistence in `useAppStore`).
- **Backend / Database:** Supabase (PostgreSQL). We rely on Supabase directly from the frontend. There is no custom NestJS backend.
- **Styling:** TailwindCSS + Radix UI + Lucide React icons.
- **Monorepo:** Nx (`npx nx serve web-app`, `npx nx test web-app`, `npx nx build web-app`).

## 📂 Core Directory Architecture (`src/`)

- `components/ui/`: Reusable base components and UI primitives (Radix UI/shadcn).
- `components/`: Domain-specific components grouped by functionality (e.g., `alquiler/`, `ventas/`, `dashboard/`).
- `pages/`: Main views and application routes.
- `services/`: API calls (Supabase) and pure, complex business logic separated from the UI.
- `store/`: Global state slices using Zustand (`useAppStore.ts`).
- `hooks/`: Custom and reusable React hooks.
- `lib/`: General utility functions and configurations (e.g., `utils.ts`, `supabaseClient.ts`).
- `types/`: Shared TypeScript types and interfaces.

## 🧠 Available Agent Skills

This project has specialized AI agent skills located in the `.agents/skills/` directory. You MUST activate these skills to guide your technical decisions:

### 1. PostgreSQL Table Design (`.agents/skills/postgresql-table-design`)

Use this skill when you need to design, modify, or review PostgreSQL database schemas (applicable to the Supabase backend).

- **Focus:** Normalization (3NF), indexes (B-tree, GIN), correct data types (`TIMESTAMPTZ`, `NUMERIC`, `TEXT`), appropriate use of JSONB, and performance tuning.
- **Suggested Activation:** When creating new tables, reviewing slow queries, or designing new features that require persistence.

### 2. Web Design Guidelines (`.agents/skills/web-design-guidelines`)

Use this skill when you need to audit, review, or improve the User Interface (UI), User Experience (UX), or accessibility.

- **Focus:** Compliance with web design best practices, accessibility, and UI/UX conventions based on Vercel's guidelines.
- **Suggested Activation:** When implementing new components, reviewing frontend-related PRs, or when the user asks to "review the UI" or "audit the design".

### 3. Vercel React Best Practices (`.agents/skills/vercel-react-best-practices`)

Use this skill to ensure optimal performance and correct patterns in React components.

- **Focus:** Re-render optimization, correct state management (Lazy State Init, functional setState), proper use of `useMemo`/`useCallback`, and asynchronous patterns.
- **Suggested Activation:** When refactoring complex React components, reviewing performance issues in the frontend, or implementing new state logic.

### 4. Supabase Postgres Best Practices (`.agents/skills/supabase-postgres-best-practices`)

Use this skill for performance optimization and Postgres best practices specific to Supabase.

- **Focus:** Query performance, connection management, security and RLS, high-impact schema design, and data access patterns.
- **Suggested Activation:** When writing complex SQL queries, designing Row-Level Security (RLS) policies, reviewing database slowness issues, or implementing advanced optimizations.

## 📏 Code Style & Testing Guidelines

### Import Organization

- Third-party imports first (React, libraries)
- Internal imports second (using `@/` alias for absolute paths)
- Prefer named imports over default where possible
- Group related imports together

### Naming Conventions

- **Components**: PascalCase (`SalesList`, `DashboardPage`)
- **Hooks**: camelCase starting with "use" (`useMobile`, `useAppStore`)
- **Types/Interfaces**: PascalCase (`Sale`, `PaymentMethod`, `CartItem`)
- **Constants**: UPPER_SNAKE_CASE for export constants (`DEFAULT_LITER_BREAKPOINTS`)
- **Functions**: camelCase (`addToCart`, `deleteSale`)

### Type Definitions

- Use strict TypeScript with no implicit any.
- Define shared types in `src/types/index.ts`.
- Store dates as strings in `'YYYY-MM-DD'` format.

### React Component Patterns

- Functional components with hooks.
- Props interfaces defined above component.
- Extract reusable logic into custom hooks (e.g. `usePullToRefresh`).
- Use `useMemo` for expensive computations.

### Styling (TailwindCSS)

- Use utility-first approach.
- Group related classes (e.g. `flex items-center justify-between`).
- Responsive design with mobile-first approach.
- Use Radix UI primitives for accessible components.

### Testing Guidelines

- Use Vitest and React Testing Library.
- Run tests: `npx vitest run path/to/test.test.tsx` or `npx vitest --run -t "test name"`.
- Mock external dependencies (Supabase, store, icons).
- Use `data-testid` attributes for selecting elements.
- **CRITICAL - TEST VALIDATION:** Whenever you modify a file that has an associated test file (e.g., modifying `SalesList.tsx` when `SalesList.test.tsx` exists), you MUST run the corresponding test immediately after your implementation to ensure no regressions were introduced.
- **CRITICAL - TEST CREATION:** If you implement a significant new feature or modify relevant business logic in a file that does NOT have an associated test file, you MUST explicitly offer the user the option to create unit tests for that code before concluding the task.

## ⚠️ Global Development Rules

1.  **State Management:** All global state lives in `src/store/useAppStore.ts`. Use local state (`useState`) only for UI-specific, ephemeral data (e.g., modal open/close).
2.  **Date Handling:** Always use `src/services/DateService.ts` (`getVenezuelaDate`) or `date-fns`. Store dates as `YYYY-MM-DD` strings.
3.  **Currency:** Use `src/services/CurrencyService.ts` for USD/Bs conversions. Never hardcode exchange rates; always pull from `useAppStore().config.exchangeRate`.
4.  **Error Handling:** Use `try-catch` for all Supabase calls. Provide optimistic UI updates when possible, but always fallback to local state if the network request fails. Use `toast` (Sonner) to inform the user.
