-- Align expense_payment_splits RLS with existing split tables.
drop policy if exists "Allow all operations on expense_payment_splits"
on public.expense_payment_splits;

create policy "Allow all operations on expense_payment_splits"
on public.expense_payment_splits
as permissive
for all
to public
using (true)
with check (true);
