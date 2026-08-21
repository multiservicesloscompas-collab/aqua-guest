# Code Verification, Fixing, and Refactoring Guidelines

This document is the absolute source of truth for **all verification, bug fixing, and refactoring tasks**. It must be loaded and strictly followed whenever an agent is requested to analyze, touch, fix, or improve existing code.

---

## 🧭 Step-by-Step Verification Protocol

Before writing or modifying a single line of code, you must execute this verification sequence and declare your findings in the conversation.

### Step 1: Exploration & Reusability First (Extremely DRY)
Before writing any new code, you must always explore which existing code elements are reusable and/or easily modifiable to satisfy the requirements.
1. Run a comprehensive `grep` or `glob` search across the codebase for any utility, function, helper, component, or domain structure that performs a similar or overlapping role.
2. Carefully analyze if these existing elements can be directly reused or easily modified/extended rather than writing new code from scratch.
3. If reusable or adaptable logic is found:
   - **Reutilize it** directly.
   - Or **refactor/extend it** to make it generic if it almost matches your needs.
   - **Do not duplicate it.** Never create what can be adapted.

### Step 2: Magic Strings & Magic Numbers Mapping
Raw literals in business logic degrade stability and readability.
1. Identify all state transitions, workflow phases, statuses, or static values you intend to reference or create.
2. Verify if these mappings already exist in the domain layer (`shared-domain/` or equivalent).
3. If they do not exist:
   - Create a clean, immutable object mapping or strict TypeScript `enum`/`union`.
   - Map them near the domain concepts to avoid scattered constants.
   - **Never hardcode raw strings or numbers.**

### Step 3: Strict TypeScript & Type-Safety Check
Ensure compile-time guarantees are fully preserved.
1. Declare strongly-typed interfaces or types for all new structures.
2. Avoid any bypass of the compiler. The use of `any` is strictly banned, and `unknown` must only be used for raw network or parsing boundaries before validation.
3. **The Absolute Integrations Exception**:
   - If `any` or `unknown` is mathematically unavoidable due to external libraries, you **must** justify it inline using ESLint direct ignore comments:
     ```typescript
     // eslint-disable-next-line @typescript-eslint/no-explicit-any -- [Specific technical explanation of why type casting or library constraints made this unavoidable]
     ```

### Step 4: Validation Layer Placement
Do not scatter validations in controllers or random helpers. Refer to the layered architecture:
1. **Level 1 (Primitive Boundaries)**: Raw validation (email regex, string lengths, UUID formats, base64 shapes) belongs in the static `.create()` or `.createResult()` of a **Value Object** inside `shared-domain/shared/value-objects/`.
2. **Level 2 (Cohesion Boundaries)**: Multi-field consistency or entity invariants belong in **Domain Entities** builders.
3. **Level 3 (Context Boundaries)**: Database uniqueness, session permissions, or environmental checks belong in the **Use Case** execution closure.
*Before adding a validation, ask: "Is this validation in the correct layer, or should it be delegated to a Value Object or Entity?"*

### Step 5: KISS Justification Gate (Keep It Simple, Stupid)
Writing clever code is an anti-pattern. We value simplicity and maintainability over cleverness.
1. **MANDATORY**: Before executing any code modification, you **must** conversationalize and output a brief explanation to the human user covering:
   - Why the proposed approach is the simplest path to the goal.
   - How it avoids over-engineering.
   - Why this specific path adheres to the KISS principle.

### Step 6: File Length & Hard Refactoring Rule (Strict 400-Line Limit)
Files that are too large increase cognitive load and make maintenance extremely difficult.
1. **MANDATORY**: Check the total line count of any file you are creating, modifying, or refactoring.
2. If any file exceeds **400 lines**, it **MUST** be refactored into smaller, highly cohesive and independent modular units (such as splitting components, extracting pure functions, or isolating utility helpers).
*Note: In `conventions.md`, there is a guideline suggesting proactive evaluation at 300 lines, but 400 lines is a **HARD LIMIT** that triggers mandatory refactoring.*

---

## 🎯 Verification Definition of Done (DoD)

Before declaring a task finished, check off every single item below:

- [ ] **DRY Verified**: Performed a search; confirmed no duplicate utilities or domain models were created.
- [ ] **No Magic Literals**: Zero magic strings or magic numbers in the business logic; all states are mapped.
- [ ] **Strict Type Safety**: Zero un-justified uses of `any`. If bypasses exist, they contain the mandatory ESLint justification comment.
- [ ] **Validations Correctly Layered**: All new/modified validations reside in their correct architectural layer (Value Object, Entity, or Use Case).
- [ ] **KISS Justification Provided**: Formally explained the simplicity of the solution before coding.
- [ ] **Clean Code Comments Policy (Minimize Comments)**:
  - Clean code must be self-documenting. 
  - Zero redundant comments (no "increments counter by 1" or decorative headers).
  - Comments are **only** permitted for:
    1. Mandatory ESLint bypass justifications (`// eslint-disable-next-line...`).
    2. Documenting non-obvious business/domain decisions or external integration quirks.
- [ ] **Strict File Length Limits**: Every file touched or created is strictly under 400 lines. If a file exceeds 400 lines, it has been refactored into smaller, highly cohesive units.
- [ ] **No Regressions**: All existing tests in the affected files pass, and new tests cover the refactored/fixed logic.
