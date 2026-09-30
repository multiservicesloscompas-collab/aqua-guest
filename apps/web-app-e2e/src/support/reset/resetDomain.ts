import { todayVe } from '../bugs/dates';
import { getSupabaseClient } from '../supabaseClient';
import {
  BASELINE_CUSTOMERS,
  BASELINE_EXCHANGE_RATE,
  BASELINE_LITER_PRICING,
  BASELINE_MACHINES,
  BASELINE_PRODUCTS,
} from './baseline';

/**
 * Every table the app owns, in a safe delete order: children first. The split
 * tables also cascade from their parent, but deleting them first keeps each
 * step independent of that.
 */
export const DOMAIN_TABLES = [
  'sale_payment_splits',
  'rental_payment_splits',
  'expense_payment_splits',
  'tips',
  'tip_payout_idempotency',
  'sales',
  'washer_rentals',
  'expenses',
  'prepaid_orders',
  'payment_balance_transactions',
  'customers',
  'washing_machines',
  'exchange_rates',
  'liter_pricing',
  'products',
] as const;

export type DomainTable = (typeof DOMAIN_TABLES)[number];
export type RowCounts = Record<DomainTable, number>;

export interface ResetOptions {
  /** Insert the baseline after wiping. Default true. */
  seed?: boolean;
  /** Only count what would be deleted; change nothing. */
  dryRun?: boolean;
}

export interface ResetReport {
  dryRun: boolean;
  seeded: boolean;
  before: RowCounts;
  after: RowCounts;
}

type Client = ReturnType<typeof getSupabaseClient>;

export async function countDomainRows(client: Client): Promise<RowCounts> {
  const counts = {} as RowCounts;
  for (const table of DOMAIN_TABLES) {
    const { count, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true });
    if (error) {
      throw new Error(`Reset: cannot count ${table}: ${error.message}`);
    }
    counts[table] = count ?? 0;
  }
  return counts;
}

async function purgeAll(client: Client): Promise<void> {
  for (const table of DOMAIN_TABLES) {
    const { error } = await client.from(table).delete().not('id', 'is', null);
    if (error) {
      throw new Error(`Reset: cannot delete ${table}: ${error.message}`);
    }
  }
}

async function insertRows(
  client: Client,
  table: DomainTable,
  rows: readonly object[]
): Promise<void> {
  const { error } = await client.from(table).insert([...rows]);
  if (error) {
    throw new Error(`Reset: cannot seed ${table}: ${error.message}`);
  }
}

async function seedBaseline(client: Client): Promise<void> {
  await insertRows(client, 'products', BASELINE_PRODUCTS);
  await insertRows(client, 'liter_pricing', BASELINE_LITER_PRICING);
  await insertRows(client, 'exchange_rates', [
    { date: todayVe(), rate: BASELINE_EXCHANGE_RATE },
  ]);
  await insertRows(client, 'washing_machines', BASELINE_MACHINES);
  await insertRows(client, 'customers', BASELINE_CUSTOMERS);
}

/**
 * Wipes the local e2e database and, by default, seeds the baseline. Talks to
 * the database only through the client from `supabaseClient.ts`, which aborts
 * unless the Supabase URL is local.
 */
export async function resetDomain(
  options: ResetOptions = {}
): Promise<ResetReport> {
  const { seed = true, dryRun = false } = options;
  const client = getSupabaseClient();
  const before = await countDomainRows(client);

  if (dryRun) {
    return { dryRun, seeded: false, before, after: before };
  }

  await purgeAll(client);
  const afterPurge = await countDomainRows(client);
  const leftovers = DOMAIN_TABLES.filter((table) => afterPurge[table] !== 0);
  if (leftovers.length > 0) {
    throw new Error(
      `Reset: rows survived the purge in ${leftovers.join(', ')}`
    );
  }

  if (seed) {
    await seedBaseline(client);
  }

  return {
    dryRun,
    seeded: seed,
    before,
    after: await countDomainRows(client),
  };
}

export function formatReport(report: ResetReport): string {
  const rows = DOMAIN_TABLES.map(
    (table) =>
      `  ${table.padEnd(30)} ${String(report.before[table]).padStart(
        6
      )} -> ${String(report.after[table]).padStart(6)}`
  );
  const title = report.dryRun
    ? 'SIMULACIÓN: no se borró nada'
    : report.seeded
    ? 'Base local reiniciada y línea base sembrada'
    : 'Base local vaciada por completo (sin línea base)';
  return `\n${title}\n  tabla                          antes  -> después\n${rows.join(
    '\n'
  )}\n`;
}
