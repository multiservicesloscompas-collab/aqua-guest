import { expect } from '@playwright/test';
import {
  listTipPayoutExpensesByDate,
  listTipsBySaleOriginIds,
} from '../supabaseClient';

export async function waitTipsBySaleOrigins(
  saleIds: string[],
  expectedCount: number,
  timeoutMs = 20_000
) {
  let resolved = await listTipsBySaleOriginIds(saleIds);

  await expect
    .poll(
      async () => {
        resolved = await listTipsBySaleOriginIds(saleIds);
        return resolved.length;
      },
      { timeout: timeoutMs, intervals: [250, 500, 1_000] }
    )
    .toBe(expectedCount);

  return resolved;
}

export async function waitTipPayoutExpensesByDate(
  date: string,
  expectedCount: number,
  timeoutMs = 20_000
) {
  let resolved = await listTipPayoutExpensesByDate(date);

  await expect
    .poll(
      async () => {
        resolved = await listTipPayoutExpensesByDate(date);
        return resolved.length;
      },
      { timeout: timeoutMs, intervals: [250, 500, 1_000] }
    )
    .toBe(expectedCount);

  return resolved;
}
