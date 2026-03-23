-- Add traceable non-equivalent transfer fields for payment balance transactions.
-- Backward compatible with legacy rows that only use amount/amount_bs/amount_usd.

alter table if exists public.payment_balance_transactions
  add column if not exists operation_type text not null default 'equilibrio',
  add column if not exists amount_out_bs numeric,
  add column if not exists amount_out_usd numeric,
  add column if not exists amount_in_bs numeric,
  add column if not exists amount_in_usd numeric,
  add column if not exists difference_bs numeric,
  add column if not exists difference_usd numeric;

alter table if exists public.payment_balance_transactions
  drop constraint if exists payment_balance_transactions_operation_type_chk;

alter table if exists public.payment_balance_transactions
  add constraint payment_balance_transactions_operation_type_chk
  check (operation_type in ('equilibrio', 'avance'));

alter table if exists public.payment_balance_transactions
  drop constraint if exists payment_balance_transactions_difference_bs_chk;

alter table if exists public.payment_balance_transactions
  add constraint payment_balance_transactions_difference_bs_chk
  check (
    (
      amount_out_bs is null
      and amount_in_bs is null
      and difference_bs is null
    )
    or (
      amount_out_bs is not null
      and amount_in_bs is not null
      and difference_bs is not null
      and difference_bs = (amount_in_bs - amount_out_bs)
    )
  );

alter table if exists public.payment_balance_transactions
  drop constraint if exists payment_balance_transactions_difference_usd_chk;

alter table if exists public.payment_balance_transactions
  add constraint payment_balance_transactions_difference_usd_chk
  check (
    difference_usd is null
    or (
      amount_out_usd is not null
      and amount_in_usd is not null
      and difference_usd = (amount_in_usd - amount_out_usd)
    )
  );
