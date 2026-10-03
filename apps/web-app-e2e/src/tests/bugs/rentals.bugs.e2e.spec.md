# Rentals bugs (red on purpose)

Run: `npm run e2e:bugs` (all) or `npm run e2e:live -- --bugs`. Full write-ups: `docs/audit/production-bugs.md`.

| ID         | User action                                                                           | Expected  | Actual today | Root cause                                                                                                                                     |
| :--------- | :------------------------------------------------------------------------------------ | :-------- | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| B4 (fixed) | Open the Efectivo detail after a $5 rental paid at rate 36.5 and the rate moved to 50 | Bs 182.50 | Bs 250.00    | `hasValidMixedPaymentSplits` ignores single-split rentals, so attribution falls back to `totalUsd * rate` (`paymentSplitAttribution.ts:61-98`) |

Controls (must pass now and after the fixes): Saturday 13:00 still ends at 20:00; Sunday 10:00 already gives Monday 09:00.
