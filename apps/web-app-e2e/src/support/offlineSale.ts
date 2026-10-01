import { expect, type BrowserContext, type Page } from '@playwright/test';
import { createWaterSale } from './drivers/waterSaleDriver';
import { createRunMarker } from './runMarker';
import {
  findLatestSaleByMarker,
  getSupabaseClient,
  listSaleSplitsBySaleIds,
} from './supabaseClient';
import { bootstrapAtDashboard } from './waterSalesTipsMatrix/uiHelpers';


export async function registerSaleOffline(
  page: Page,
  context: BrowserContext,
  options: { globalOrchestrator: boolean; tip: boolean }
): Promise<{ saleId?: string; splitCount: number; tipOriginIds: string[] }> {
  if (options.globalOrchestrator) {
    await context.addInitScript(
      "window.localStorage.setItem('offline.flag.global_orchestrator', 'true')"
    );
  }
  const marker = createRunMarker();
  await bootstrapAtDashboard(page);
  await context.setOffline(true);
  await createWaterSale(
    page,
    {
      basePriceBs: 1000,
      splits: [{ method: 'efectivo', amountBs: 1000 }],
      tip: options.tip
        ? { amountBs: 100, method: 'efectivo', paid: false }
        : undefined,
      noteMarker: marker.notesValue,
    },
    { waitForToast: false }
  );
  await page.waitForTimeout(1_000);
  await context.setOffline(false);
  await expect
    .poll(async () => (await findLatestSaleByMarker(marker.notesValue))?.id, {
      timeout: 40_000,
    })
    .toBeTruthy();
  await page.waitForTimeout(15_000);
  const sale = await findLatestSaleByMarker(marker.notesValue);
  const splits = sale ? await listSaleSplitsBySaleIds([sale.id]) : [];
  const { data: tips } = await getSupabaseClient()
    .from('tips')
    .select('origin_id');
  return {
    saleId: sale?.id,
    splitCount: splits.length,
    tipOriginIds: (tips ?? []).map((tip) => tip.origin_id as string),
  };
}
