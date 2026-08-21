# ResultComposer

Load this doc when a task needs sequential `Result` composition with short-circuit failure and named accumulated data.

## Use When

- you have 2 or more sequential `Result` or `Promise<Result>` steps;
- later steps depend on earlier validated values;
- you want a typed object from named intermediate results.

Do not use it for:

- a single `Result` operation;
- parallel independent async work;
- APIs that do not return `Result`.

## Real API

Source of truth:

- implementation: `server/src/domain/shared/result-composer.ts` and `client/src/domain/shared/result-composer.ts`
- behavior: `server/src/domain/shared/__test__/result-composer.spec.ts` and `client/src/domain/shared/__test__/result-composer.spec.ts`

Use the real builder API only:

```ts
const composerResult = await ResultComposer.start()
  .useResult('user', userRepository.getById(userId))
  .useResult('profile', ({ user }) => profileRepository.getByUserId(user.id))
  .run();
```

`useResult` accepts:

- `Result<V, E>`
- `Promise<Result<V, E>>`
- `(data) => Result<V, E>`
- `(data) => Promise<Result<V, E>>`

Optional third argument:

- a string error message;
- an error mapping function.

## Standard Pattern

```ts
const composerResult = await ResultComposer.start()
  .useResult('family', templateFamilyRepository.findByName(name))
  .useResult('dimension', dimensionRepository.getById(dimensionId))
  .useResult('template', ({ family, dimension }) =>
    TemplateEntity.create({
      versionTag,
      templateFamilyId: family.id,
      dimensionId: dimension.id,
    }),
  )
  .run();

if (composerResult.isFailure) {
  return Result.fail(composerResult.getError());
}

const { template } = composerResult.getData();
return Result.ok(template);
```

## Anti-Verbosity Rules

- pass direct `Result` values directly to `.useResult(...)`;
- use callbacks only when a step depends on previous data;
- destructure only the needed previous values;
- wrap with a higher-level `Result.fail(...)` once after `.run()` when context really changes.

Do not wrap functions that already return `Result` with unnecessary `Result.ok(...)` or `Result.fail(...)` boilerplate.

```ts
.useResult('id', VO.IdVO.createResult(input.id))

// Avoid
.useResult('id', () => {
  const result = VO.IdVO.createResult(input.id);
  if (result.isFailure) {
    return Result.fail(result.getError());
  }
  return Result.ok(result.getValue());
})
```

Prefer:

```ts
.useResult('profile', ({ user }) => profileRepository.getByUserId(user.id))
```

Instead of:

```ts
.useResult('profile', (data) => profileRepository.getByUserId(data.user.id))
```

## Gotchas

- `run()` becomes async if any step is async; prefer `await run()` in application code.
- `getData()` throws if the composer failed.
- `getError()` throws if the composer succeeded.
- duplicate keys fail at runtime.
- execution is sequential, not parallel.

## Routing

- Human-oriented deep dive: `docs/result-composer.md`
