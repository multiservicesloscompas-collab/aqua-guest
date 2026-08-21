# Testing

Detailed context on testing practices, configuration, and standards.

---

## 🛠️ Testing Stack

- **Frontend (Client):** Jest / Vitest (to be configured during refactor)
- **Backend (Server):** Jest / Vitest for testing Domain Layer (Entities/Value Objects) and Application Layer (Use Cases)

---

## 🚀 Commands

```bash
# Run client tests
npm run test --prefix client

# Run server tests (when configured)
npm run test --prefix server
```

---

## 📋 Conventions & Rules

| Rule | Detail |
| :--- | :--- |
| **Location** | Place tests in a `__test__/` or `tests/` directory adjacent to the code being tested. |
| **Naming** | Use the `.spec.ts` or `.test.ts` suffix (e.g., `email.vo.spec.ts`). |
| **Purity** | Domain and Application tests must be deterministic and unit-focused. No side effects. |
| **No Networking** | Never make real network calls or touch database instances. Mock all external dependencies (Mongoose, Apollo). |
| **Object Mother** | Use the Object Mother pattern to create consistent test fixtures. |

---

## 🧱 The Object Mother Pattern

When an Object Mother exists for a specific domain context, always use it to generate test data.

```typescript
// ✅ Correct: Use Object Mother for consistency
const product = ProductMother.create({ name: 'Laptop' });

// ❌ Incorrect: Do not manually build complex objects in every test
const product = {
  id: '...',
  name: 'Laptop',
  price: 1500,
  stock: 10,
};
```

---

## 🧪 Test Structure Example (Unit / Domain)

```typescript
describe('EmailVO', () => {
  describe('create', () => {
    it('should return ok for a valid email', () => {
      const result = EmailVO.create('user@example.com');
      expect(result.isSuccess).toBe(true);
    });

    it('should return fail for an invalid email', () => {
      const result = EmailVO.create('not-an-email');
      expect(result.isFailure).toBe(true);
    });
  });
});
```

---

## ✅ Pre-commit Verification

Always run the build and test scripts before committing or opening a PR to ensure repository health.
