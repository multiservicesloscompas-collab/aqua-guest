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

## Dashboard And Transactions

- Dashboard metrics are aggregated results, not isolated source-of-truth records.
- Transactions and payment summaries are derived views built from multiple domains.
- Any commercial change that affects payment shape, paid status, dates, or tips can alter these derived views.

## Practical Rule

If a change touches Water Sales or Washer Rentals, assume cross-module financial impact until proven otherwise.
