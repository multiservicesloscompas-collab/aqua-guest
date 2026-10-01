# Commercial Rules Guide

> [!IMPORTANT]
> Load this doc when a task affects Water Sales, Washer Rentals, payments, tips, dashboard totals, transactions, or financial summaries.

## Definition

In AquaGuest, `commercial modules` currently means:

- Water Sales
- Washer Rentals

These modules are not isolated. A record change in either module can ripple into multiple financial views.

## Mandatory Ripple-Effect Review

When creating, editing, deleting, or recalculating records in a commercial module, review impact on:

- Dashboard metrics and totals
- Payment-method summaries
- Chronological transaction summaries
- Payment-method detail views
- Tips tracking
- Expenses when tip payouts are recorded

For implementation detail and visual mapping, also load `apps/web-app/docs/business-logic-dependencies.md`.

## Mixed Payments

- Mixed payments must distribute amounts correctly across payment methods.
- Do not attribute a mixed-payment total to a single primary method if split records exist.
- If persistence logic changes, also load `apps/web-app/docs/pago-mixto-db-contract.md`.
- Changes to mixed-payment creation or editing must be checked against downstream summaries, not only against the source form.

## Tips

- Tips are tracked independently from the parent sale or rental after capture.
- Tips affect the Tips module.
- Tips affect Expenses only when the tip payout has actually been paid.
- Do not reduce net business totals for a pending tip.
- **Store input contract when editing with a tip:** `updateSale` / `updateRental` receive `tipInput` plus **principal-only** totals and splits (what the customer owes without the tip). The store computes `final total = principal + tip` and adds the tip to the split of the tip's capture method (creating that split if missing). Callers must never pass splits or totals that already include the tip, or the tip is counted twice. Edit forms therefore hydrate from principal-only splits: `resolveSplitFormHydrationState({ ..., tip })` removes the tip with `removeTipFromPaymentSplits` (inverse of `mergeTipIntoPaymentSplits`, `services/transactions/transactionTotals.ts`). The edit-sale sheet does this directly (B3); the edit-rental sheet does it when the persisted tip is hydrated (`useEditRentalTipHydration` `onTipHydrated`, B3b).
- The legacy `payment_method` column of a sale or rental is derived from its splits: the method with the largest `amountBs` wins (ties resolve alphabetically). It is a compatibility field, never the source of truth for mixed payments.
- **Tips store cache:** loading tips for a date range replaces the cached tips inside that range (tips deleted or moved elsewhere must disappear); it does not only merge.

## Dashboard And Transactions

- Dashboard metrics are aggregated results, not isolated source-of-truth records.
- Transactions and payment summaries are derived views built from multiple domains.
- Any commercial change that affects payment shape, paid status, dates, or tips can alter these derived views.
- Equilibrio (`calculatePaymentBalanceSummary`) must agree with the dashboard per-method cards: its per-method `originalTotal` is the day's income minus the day's expenses and paid tip payouts on that method (`services/payments/methodOutflows.ts`, shared with the dashboard); `adjustments` are transfers only.

## Practical Rule

If a change touches Water Sales or Washer Rentals, assume cross-module financial impact until proven otherwise.
