# Rentals bugs (red on purpose)

Run: `npm run e2e:bugs` (all) or `npm run e2e:live -- --bugs`. Full write-ups: `docs/audit/production-bugs.md`.

| ID  | User action                                                                           | Expected            | Actual today                            | Root cause                                                                                                                                     |
| :-- | :------------------------------------------------------------------------------------ | :------------------ | :-------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| B4  | Open the Efectivo detail after a $5 rental paid at rate 36.5 and the rate moved to 50 | Bs 182.50           | Bs 250.00                               | `hasValidMixedPaymentSplits` ignores single-split rentals, so attribution falls back to `totalUsd * rate` (`paymentSplitAttribution.ts:61-98`) |
| B7  | Open the edit sheet of a rental paid in efectivo                                      | "Completo" costs $6 | "Completo $5"                           | `editRentalSheetViewModel.helpers.ts:112` checks `efectivo` where `rentalPricing.ts:9` checks `divisa`. Display only                           |
| B9  | New rental on a Sunday, medio turno, delivery 13:00 or 14:00                          | Pickup Monday 09:00 | "Hoy a las 20:00" (Sunday, shop closed) | The 13:00/14:00 exception in `calculatePickupTime` hardcodes 20:00                                                                             |
| B2  | Open the edit sheet, type a note, wait for the exchange rate to load                  | The note stays      | The note is replaced by the stored one  | `useEditRentalFormState.ts` resets every field in a `useEffect` on `[rental, exchangeRate]`                                                    |

Controls (must pass now and after the fixes): Saturday 13:00 still ends at 20:00; Sunday 10:00 already gives Monday 09:00.
