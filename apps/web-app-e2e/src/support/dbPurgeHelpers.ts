import { getSupabaseClient } from './supabaseClient';

export async function purgeWaterSales(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('sale_payment_splits').delete().not('id', 'is', null);
  await supabase.from('tips').delete().eq('origin_type', 'sale');
  const { error } = await supabase.from('sales').delete().not('id', 'is', null);
  if (error) {
    throw new Error(`Failed to purge water sales: ${error.message}`);
  }
}

export async function countWaterSales(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`Failed to count sales: ${error.message}`);
  }
  return count ?? 0;
}

export async function purgeWasherRentals(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('rental_payment_splits').delete().not('id', 'is', null);
  await supabase.from('tips').delete().eq('origin_type', 'rental');
  const { error } = await supabase
    .from('washer_rentals')
    .delete()
    .not('id', 'is', null);
  if (error) {
    throw new Error(`Failed to purge washer rentals: ${error.message}`);
  }
}

export async function countWasherRentals(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('washer_rentals')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`Failed to count washer rentals: ${error.message}`);
  }
  return count ?? 0;
}

export async function purgeExpensesAndTips(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('expense_payment_splits').delete().not('id', 'is', null);
  await supabase.from('expenses').delete().not('id', 'is', null);
  const { error } = await supabase.from('tips').delete().not('id', 'is', null);
  if (error) {
    throw new Error(`Failed to purge expenses and tips: ${error.message}`);
  }
}

export async function countExpenses(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`Failed to count expenses: ${error.message}`);
  }
  return count ?? 0;
}

export async function countTips(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('tips')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`Failed to count tips: ${error.message}`);
  }
  return count ?? 0;
}

export async function ensureWashingMachinesExist(): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: existing } = await supabase
    .from('washing_machines')
    .select('id, name');

  const requiredNames = [
    'Lavadora 1',
    'Lavadora 2',
    'Lavadora 3',
    'Lavadora 4',
    'Lavadora 5',
  ];
  const existingNames = new Set(existing?.map((m) => m.name) ?? []);

  const toInsert = requiredNames
    .filter((name) => !existingNames.has(name))
    .map((name, index) => ({
      name,
      kg: 10 + index * 2,
      brand: 'Standard',
      status: 'available',
      is_available: true,
    }));

  if (toInsert.length > 0) {
    await supabase.from('washing_machines').insert(toInsert);
  }

  // Reset status to available so machines are not blocked by leftover runs
  await supabase
    .from('washing_machines')
    .update({ is_available: true, status: 'available' })
    .not('id', 'is', null);
}

export async function purgeAllDomainData(): Promise<void> {
  await purgeWaterSales();
  await purgeWasherRentals();
  await purgeExpensesAndTips();
  const supabase = getSupabaseClient();
  await supabase
    .from('payment_balance_transactions')
    .delete()
    .not('id', 'is', null);
  await supabase.from('prepaid_orders').delete().not('id', 'is', null);
  await ensureWashingMachinesExist();
}
