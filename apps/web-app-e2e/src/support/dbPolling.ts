import { expect } from '@playwright/test';
import {
  findLatestSaleByMarker,
  type SaleLookupResult,
} from './supabaseClient';

export async function waitForSaleByMarker(
  marker: string,
  timeoutMs = 20_000
): Promise<SaleLookupResult> {
  let resolved: SaleLookupResult | null = null;

  await expect
    .poll(
      async () => {
        resolved = await findLatestSaleByMarker(marker);
        return Boolean(resolved?.id);
      },
      {
        timeout: timeoutMs,
        intervals: [250, 500, 1_000],
      }
    )
    .toBeTruthy();

  if (!resolved) {
    throw new Error(`Sale marker not found after polling: ${marker}`);
  }

  return resolved;
}
