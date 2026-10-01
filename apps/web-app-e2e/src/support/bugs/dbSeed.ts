import { getSupabaseClient } from '../supabaseClient';

export const BUG_MARKER = 'E2E-BUG';

type Method = 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';

export interface SeedSaleInput {
  date: string;
  dailyNumber: number;
  totalBs: number;
  notes?: string;
  exchangeRate?: number;
  method?: Method;
}

function unwrap<T>(
  res: { data: T | null; error: { message: string } | null },
  what: string
): T {
  if (res.error || res.data === null) {
    throw new Error(
      `Seed failed (${what}): ${res.error?.message ?? 'no data'}`
    );
  }
  return res.data;
}

export async function seedSales(rows: SeedSaleInput[]): Promise<string[]> {
  const supabase = getSupabaseClient();
  const method = 'efectivo';
  const payload = rows.map((r) => ({
    date: r.date,
    daily_number: r.dailyNumber,
    items: [
      {
        id: `${BUG_MARKER}-item`,
        productId: 'botellon',
        name: 'Botellon',
        quantity: 1,
        unitPrice: r.totalBs,
        subtotal: r.totalBs,
      },
    ],
    payment_method: r.method ?? method,
    total_bs: r.totalBs,
    total_usd: r.totalBs / (r.exchangeRate ?? 40),
    exchange_rate: r.exchangeRate ?? 40,
    notes: r.notes ?? BUG_MARKER,
  }));
  const ids: string[] = [];
  for (let i = 0; i < payload.length; i += 100) {
    const res = await supabase
      .from('sales')
      .insert(payload.slice(i, i + 100))
      .select('id');
    ids.push(...unwrap(res, 'sales').map((r: { id: string }) => r.id));
  }
  return ids;
}

export async function seedCustomer(input: {
  name: string;
  phone?: string | null;
  address?: string | null;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const res = await supabase
    .from('customers')
    .insert({
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .select('id')
    .single();
  return unwrap(res, 'customer').id as string;
}

export async function firstMachineId(): Promise<number> {
  const supabase = getSupabaseClient();
  const res = await supabase
    .from('washing_machines')
    .select('id')
    .order('kg', { ascending: false })
    .limit(1)
    .single();
  return unwrap(res, 'machine').id as number;
}

export interface SeedRentalInput {
  date: string;
  machineId: number;
  shift: string;
  deliveryTime: string;
  pickupDate: string;
  pickupTime: string;
  totalUsd?: number;
  customerId?: string;
  status?: string;
  isPaid?: boolean;
  datePaid?: string | null;
  notes?: string;
}

export async function seedRental(input: SeedRentalInput): Promise<string> {
  const supabase = getSupabaseClient();
  const res = await supabase
    .from('washer_rentals')
    .insert({
      date: input.date,
      customer_id: input.customerId ?? null,
      machine_id: input.machineId,
      shift: input.shift,
      delivery_time: input.deliveryTime,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      delivery_fee: 0,
      total_usd: input.totalUsd ?? 6,
      payment_method: 'efectivo',
      status: input.status ?? 'agendado',
      is_paid: input.isPaid ?? false,
      date_paid: input.datePaid ?? null,
      notes: input.notes ?? BUG_MARKER,
    })
    .select('id')
    .single();
  return unwrap(res, 'rental').id as string;
}

export async function seedExpense(input: {
  date: string;
  amount: number;
  description?: string;
  method?: Method;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const res = await supabase
    .from('expenses')
    .insert({
      date: input.date,
      description: input.description ?? `${BUG_MARKER} gasto`,
      amount: input.amount,
      category: 'otros',
      payment_method: input.method ?? 'efectivo',
    })
    .select('id')
    .single();
  return unwrap(res, 'expense').id as string;
}

export async function seedPendingTip(input: {
  originId: string;
  originType: 'sale' | 'rental';
  tipDate: string;
  amountBs: number;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const res = await supabase
    .from('tips')
    .insert({
      origin_id: input.originId,
      origin_type: input.originType,
      tip_date: input.tipDate,
      amount_bs: input.amountBs,
      capture_payment_method: 'efectivo',
      status: 'pending',
    })
    .select('id')
    .single();
  return unwrap(res, 'tip').id as string;
}

export async function setExchangeRate(
  date: string,
  rate: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({ date, rate }, { onConflict: 'date' });
  if (error) throw new Error(`Seed failed (exchange rate): ${error.message}`);
}

export async function cleanupBugData(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('customers').delete().ilike('name', `${BUG_MARKER}%`);
  await supabase
    .from('exchange_rates')
    .delete()
    .not('id', 'is', null)
    .lte('rate', 0);
}
