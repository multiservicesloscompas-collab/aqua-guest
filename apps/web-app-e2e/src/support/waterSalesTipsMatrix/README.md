# Water Sales Tips Matrix Helpers

Deterministic helper modules for `water-sales-tips-matrix.e2e.spec.ts`.

## Seed control

Use `E2E_TIPS_MATRIX_SEED` to replay the exact generated matrix:

```bash
E2E_TIPS_MATRIX_SEED=20260323 npx nx e2e web-app-e2e -- --grep "water sales tips matrix"
```

If omitted, helpers fallback to a fixed default seed.

## Deterministic replay recipe

1. Copy failing run seed from test annotation/output.
2. Re-run with `E2E_TIPS_MATRIX_SEED=<seed>`.
3. Keep the same Playwright project (`chromium`) and viewport.
