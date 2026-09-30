import { expect, test, type Page } from '@playwright/test';
import { purgeAllDomainData } from '../dbPurgeHelpers';
import { getSupabaseClient } from '../supabaseClient';
import { cleanupBugData } from './dbSeed';
import { todayVe } from './dates';

/** Clean DB state before each bug spec and restore shared fixtures afterwards. */
export function useCleanDomain(): void {
  test.beforeEach(async () => {
    await purgeAllDomainData();
    await cleanupBugData();
  });

  test.afterEach(async () => {
    await cleanupBugData();
  });
}

/** Records a bug id + code evidence on the test report. */
export function bug(id: string, evidence: string): void {
  test.info().annotations.push({ type: 'bug', description: `${id} · ${evidence}` });
}

/** Saves today's exchange rate row and returns a function that restores it. */
export async function snapshotTodayRate(): Promise<() => Promise<void>> {
  const supabase = getSupabaseClient();
  const today = todayVe();
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('date', today)
    .maybeSingle();
  const previous = data?.rate as number | undefined;
  return async () => {
    if (previous === undefined) {
      await supabase.from('exchange_rates').delete().eq('date', today);
    } else {
      await supabase.from('exchange_rates').upsert({ date: today, rate: previous }, { onConflict: 'date' });
    }
  };
}

export async function currentRate(): Promise<number> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.rate ?? 40);
}

/** Steps the shared DateSelector until it shows `date` (works on any page that renders it). */
export async function goToDate(page: Page, date: string): Promise<void> {
  const current = page.getByTestId('water-sales-current-date').first();
  await expect(current).toBeVisible();
  for (let i = 0; i < 70; i += 1) {
    const shown = (await current.getAttribute('data-date')) ?? '';
    if (shown === date) return;
    const testId = shown > date ? 'water-sales-date-prev' : 'water-sales-date-next';
    await page.getByTestId(testId).first().click();
  }
  throw new Error(`Could not navigate DateSelector to ${date}`);
}
