import { createClient } from '@supabase/supabase-js';
import { getE2EEnv } from './env';

interface SaleRow {
  id: string;
  date: string;
  daily_number: number | null;
  payment_method: string;
  total_bs: number;
  notes: string | null;
  created_at: string;
}

interface SaleSplitRow {
  sale_id: string;
  payment_method: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  amount_bs: number;
  amount_usd: number | null;
}

interface TipRow {
  id: string;
  origin_id: string;
  origin_type: 'sale' | 'rental';
  status: 'pending' | 'paid';
  amount_bs: number;
  capture_payment_method: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  paid_payment_method:
    | 'efectivo'
    | 'pago_movil'
    | 'punto_venta'
    | 'divisa'
    | null;
  tip_date: string;
}

interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  payment_method: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  created_at: string;
}

export interface SaleLookupResult {
  id: string;
  date: string;
  dailyNumber: number | null;
  paymentMethod: string;
  totalBs: number;
  notes: string | null;
  createdAt: string;
}

export interface SaleSplitLookupResult {
  saleId: string;
  paymentMethod: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  amountBs: number;
  amountUsd: number;
}

export interface TipLookupResult {
  id: string;
  originId: string;
  originType: 'sale' | 'rental';
  status: 'pending' | 'paid';
  amountBs: number;
  capturePaymentMethod: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  paidPaymentMethod?: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  tipDate: string;
}

export interface ExpenseLookupResult {
  id: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa';
  createdAt: string;
}

function getSupabaseClient() {
  const env = getE2EEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapSaleRow(sale: SaleRow): SaleLookupResult {
  return {
    id: sale.id,
    date: sale.date,
    dailyNumber: sale.daily_number,
    paymentMethod: sale.payment_method,
    totalBs: Number(sale.total_bs || 0),
    notes: sale.notes,
    createdAt: sale.created_at,
  };
}

export async function findLatestSaleByMarker(
  marker: string
): Promise<SaleLookupResult | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sales')
    .select('id,date,daily_number,payment_method,total_bs,notes,created_at')
    .ilike('notes', `%${marker}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query sale by marker: ${error.message}`);
  }

  const sale = data as SaleRow | null;
  return sale ? mapSaleRow(sale) : null;
}

export async function listSalesByMarker(
  marker: string
): Promise<SaleLookupResult[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sales')
    .select('id,date,daily_number,payment_method,total_bs,notes,created_at')
    .ilike('notes', `%${marker}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list sales by marker: ${error.message}`);
  }

  const rows = (data ?? []) as SaleRow[];
  return rows.map(mapSaleRow);
}

export async function countSalesByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to count sales by id list: ${error.message}`);
  }

  return count ?? 0;
}

export async function listDiscoverableSales(): Promise<SaleLookupResult[]> {
  const supabase = getSupabaseClient();
  const pageSize = 200;
  const rows: SaleRow[] = [];

  for (let page = 0; page < 50; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('sales')
      .select('id,date,daily_number,payment_method,total_bs,notes,created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to list discoverable sales: ${error.message}`);
    }

    const pageRows = (data ?? []) as SaleRow[];
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      break;
    }
  }

  return rows.map(mapSaleRow);
}

export async function countDiscoverableSales(): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to count discoverable sales: ${error.message}`);
  }

  return count ?? 0;
}

export async function listSaleSplitsBySaleIds(
  saleIds: string[]
): Promise<SaleSplitLookupResult[]> {
  if (saleIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sale_payment_splits')
    .select('sale_id,payment_method,amount_bs,amount_usd')
    .in('sale_id', saleIds)
    .order('sale_id', { ascending: true });

  if (error) {
    throw new Error(`Failed to list sale splits: ${error.message}`);
  }

  return ((data ?? []) as SaleSplitRow[]).map((row) => ({
    saleId: row.sale_id,
    paymentMethod: row.payment_method,
    amountBs: Number(row.amount_bs || 0),
    amountUsd: Number(row.amount_usd || 0),
  }));
}

export async function listTipsBySaleOriginIds(
  saleIds: string[]
): Promise<TipLookupResult[]> {
  if (saleIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tips')
    .select(
      'id,origin_id,origin_type,status,amount_bs,capture_payment_method,paid_payment_method,tip_date'
    )
    .eq('origin_type', 'sale')
    .in('origin_id', saleIds)
    .order('tip_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to list tips by sale origins: ${error.message}`);
  }

  return ((data ?? []) as TipRow[]).map((row) => ({
    id: row.id,
    originId: row.origin_id,
    originType: row.origin_type,
    status: row.status,
    amountBs: Number(row.amount_bs || 0),
    capturePaymentMethod: row.capture_payment_method,
    paidPaymentMethod: row.paid_payment_method ?? undefined,
    tipDate: row.tip_date,
  }));
}

export async function listTipPayoutExpensesByDate(
  date: string
): Promise<ExpenseLookupResult[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('id,date,description,amount,payment_method,created_at')
    .eq('date', date)
    .eq('description', 'Pago de Propina')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to list tip payout expenses: ${error.message}`);
  }

  return ((data ?? []) as ExpenseRow[]).map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
  }));
}
