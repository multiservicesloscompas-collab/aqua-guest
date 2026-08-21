# Code Conventions

Coding style, naming, formatting, and standard rules for the CRM Inventory Manager.

---

## 🎨 Formatting

- **Prettier:** Mandatory configuration using **single quotes**.
- **Automated Checks:** Format via editor extensions or build pipelines.

---

## 🇺🇸 Translation & Language (MANDATORY)

To prepare for a clean, global codebase, all new or modified files, variables, database schemas, GraphQL fields, and folders **MUST** be written in English.

### Translation Mapping Examples
* `pedidos` ➡️ `orders`
* `clientes` ➡️ `clients`
* `vendedor` ➡️ `seller`
* `productos` ➡️ `products`
* `crearPedido` ➡️ `createOrder`

---

## 🔄 Strict DRY (Don't Repeat Yourself) & Exploration Policy

Before writing any new function, type, interface, constant, or component, you **MUST** perform an extensive exploration of the codebase to identify elements that are already reusable and/or easily modifiable to meet the current need.

Always check if a similar or equivalent utility already exists in:
- `shared-domain/` (e.g., base monads, validators, reusable types)
- Shared folders in `client/` or `server/`.

### The Adaptation Rule
- Carefully evaluate if existing elements can be adapted or slightly refactored to fit the requirements before writing anything from scratch.
- If an existing utility is found, reuse or refactor it to accommodate your needs rather than duplicating. Never build what can be adapted.

---

## 🏷️ Naming

| Element | Convention | Example |
| :--- | :--- | :--- |
| **Files (Logic/TS)** | kebab-case with type suffix | `order.entity.ts`, `create-order.use-case.ts` |
| **Files (React/UI)** | PascalCase | `NewOrder.tsx`, `ProductList.tsx` |
| **Classes** | PascalCase | `OrderEntity` |
| **Functions / Variables** | camelCase | `calculateTotal` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_STOCK_LIMIT` |
| **Interfaces / Types** | PascalCase | `IOrderRepository`, `ClientProps` |

---

## 📁 File Suffixes

| Suffix | Layer | Example |
| :--- | :--- | :--- |
| `.entity.ts` | Domain | `order.entity.ts` |
| `.vo.ts` | Domain | `email.vo.ts` |
| `.use-case.ts` | Application | `create-order.use-case.ts` |
| `.resolver.ts` | Infrastructure (GraphQL) | `order.resolver.ts` |
| `.model.ts` | Infrastructure (Database) | `product.model.ts` |
| `.schema.ts` | Infrastructure (Database) | `client.schema.ts` |
| `.tsx` / `.jsx` | Presentation (React UI) | `Dashboard.tsx`, `EditClient.tsx` |
| `.spec.ts` | Testing | `email.vo.spec.ts` |

---

## 📦 TypeScript & Best Practices

- **Strict Mode:** Always use strict typing. No exceptions.
- **NEVER Use `any`:** Use `unknown` or generics if a type is truly dynamic.
- **Convert Class to Functional Components:** Convert legacy class components to React functional components utilizing hooks.
- **Skill Load:** When working on React, load and consult the `vercel-react-best-practices` skill to guarantee high render performance, avoid stale closures, and minimize bundle bloat.
- **Avoid Classes at All Costs (Functional-First Paradigm):** Never use ES6 classes (`class`) for representing domain entities, value objects, use cases, or services. Always represent data structures as pure TS types or interfaces, and logic as pure functions or factory closures (like the Make Pattern). Avoid class instances and `new` keywords. Only allow class definitions when strictly forced by third-party database frameworks like Mongoose models, and keep them fully encapsulated in the infrastructure layer.
- **Avoid Comments:** Do NOT write comments (such as inline explanations, JSDocs, or todo notes) unless it is strictly necessary to explain complex, non-obvious business logic. The code should be completely self-documenting through clear, expressive naming and clean structural boundaries.

### 🚫 No Magic Numbers & No Magic Strings
- Never write raw values (such as order statuses, stock limits, or role names) inline inside your business or rendering logic.
- **Where to store constants:**
  - Store configuration in dedicated `constants.ts` files.
  - Store entity-specific states as readonly static properties or frozen objects inside Domain Value Objects or Entities (e.g., `OrderState.PENDING`).

### 🧩 Pattern Matching with `ts-pattern`
- **Never** use traditional `switch` statements or deeply nested `if-else` blocks for evaluating business-critical states or statuses.
- Always use the **`ts-pattern`** library (`match` API) to ensure pattern matching is complete, exhaustive, and compile-time safe.

**Example:**
```typescript
import { match } from 'ts-pattern';

const description = match(order.status)
  .with('PENDING', () => 'Order is awaiting payment')
  .with('COMPLETED', () => 'Order is shipped and completed')
  .with('CANCELLED', () => 'Order has been cancelled')
  .exhaustive();
```

---

## 💎 Errors & Data Integrity

- **Result Monad over Throw:** Business logic and Use Cases must return the `Result<T, E>` monad rather than throwing raw errors.
- **Result Composition:** Chain operations using `ResultComposer` to eliminate nested "if-ladders".
- **Zod for Schema Validation:** Always use Zod schemas (`zod`) for validating any request inputs, environment variables, or complex configurations. Infer types dynamically via `z.infer<typeof schema>` to prevent duplicate definition of types/interfaces and keep a single source of truth. Avoid custom regular expressions or custom conditional checks when Zod can easily specify them.
- **File Size Limit:** If a file exceeds **300 lines**, proactively evaluate if it can be refactored into smaller, cohesive units.
