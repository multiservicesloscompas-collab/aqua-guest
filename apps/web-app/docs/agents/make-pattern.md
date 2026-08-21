# Make Pattern

Detailed context on the functional dependency injection pattern used in this repository.

---

## 🧩 Purpose

Use the Make pattern when a service or use case needs dependencies such as repositories,
gateways, loggers, or external clients.

The pattern keeps business logic in plain functions and makes composition explicit.

---

## ✅ Standard Shape

The first function receives dependencies. The returned function executes the business logic.

```typescript
const makeAnyService =
  (repository: IRepository, logger: ILogger) => async (input: InputDTO) => {
    return Result.ok(input);
  };

const anyService = makeAnyService(myRepo, myLogger);

await anyService(data);
```

---

## 📋 Rules

| Rule                      | Detail                                                                                     |
| :------------------------ | :----------------------------------------------------------------------------------------- |
| **Dependencies First**    | Inject dependencies in the outer function.                                                 |
| **Logic Second**          | Put business logic in the returned function only.                                          |
| **No Classes by Default** | Prefer plain functions unless a framework boundary forces another shape.                   |
| **Use Cases Orchestrate** | Use cases coordinate multiple dependencies and flows.                                      |
| **Services Stay Focused** | Services should encapsulate one domain action and should not call other services directly. |
| **Return Result**         | Use `Result.ok()` and `Result.fail()` instead of throwing.                                 |

---

## 🏛️ Where To Use It

Use the Make pattern in:

- backend use cases
- backend services
- frontend infrastructure adapters or PLoCs when dependency injection is needed
- composition roots that wire repositories, clients, and use cases together

Do not use it in:

- simple helpers with no dependencies
- React components used only for rendering

---

## 🧱 Example Use Case

```typescript
type CreateImageInput = {
  prompt: string;
};

const makeCreateImageUseCase =
  (imageRepository: ImageRepository, imageGenerator: ImageGenerator) =>
  async (input: CreateImageInput) => {
    const generatedImage = await imageGenerator.generate(input.prompt);

    if (generatedImage.isFailure) {
      return Result.fail(generatedImage.getError());
    }

    return imageRepository.save(generatedImage.getValue());
  };
```

---

## 🔎 Review Checklist

Before finishing a change that uses this pattern, verify:

1. Dependencies are injected in the outer function.
2. The returned function contains the execution flow.
3. Domain logic does not depend on framework classes.
4. Failure paths return `Result.fail()`.
5. Use cases orchestrate; services stay focused.
