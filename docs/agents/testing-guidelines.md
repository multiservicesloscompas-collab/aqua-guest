# Test Creation Metrics & Constraints

**CONDITIONAL ACTIVATION:** Follow these rules **ONLY** if you are explicitly asked to create or work with tests. Otherwise, ignore this section to avoid unnecessary context overhead.

If tasked with writing tests for a function or component:

- **Framework:** Use Unit tests with Jest (or Vitest as configured in the specific app).
- **Scope:** Cover success cases, error cases, and edge cases (null, undefined, empty arrays, boundary values).
- **Mocking:** Mock all external dependencies (e.g., Supabase, Zustand store, external APIs).
- **Coverage Targets:**
  - Minimum 80% overall coverage.
  - Core business logic functions: 100%.
  - UI/Rest of components: 80%.
  - Infrastructure/Config files: 0%.
- **Patterns & Tools:**
  - Use the **Object Mother** pattern for test data setup.
  - Generate fake test data using `@faker-js/faker`.
- **Strictness & Integrity:**
  - Use **strict TypeScript**.
  - Be strict with assertions. If an expected test fails, **DO NOT** force it to pass by altering the test logic to fit the broken behavior. Report it as an uncovered case or bug.
  - It is critical to report any uncovered code behaviors discovered during testing so the codebase can be improved in the future.
  - **DO NOT** attempt to fix the source code outside the test files unless explicitly asked. Only report the failing findings.
