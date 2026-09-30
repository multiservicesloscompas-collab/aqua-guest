import { type Page } from '@playwright/test';
import { addDays, todayVe } from '../support/bugs/dates';
import { seedSales } from '../support/bugs/dbSeed';
import { documented, expect, test } from '../support/fixtures';
import {
  countDiscoverableSales,
  listDiscoverableSales,
} from '../support/supabaseClient';
import {
  gotoDashboard,
  openTransactionsFromMenu,
  openWaterSalesFromBottomNav,
} from '../support/uiNavigation';

function parseIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = parseIsoDate(fromDate).getTime();
  const to = parseIsoDate(toDate).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((to - from) / dayMs);
}

async function getCurrentDate(page: Page): Promise<string> {
  const current = await page
    .getByTestId('water-sales-current-date')
    .getAttribute('data-date');

  if (!current) {
    throw new Error('Date selector did not expose current data-date attribute');
  }

  return current;
}

async function navigateToDate(page: Page, targetDate: string): Promise<void> {
  const maxSteps = 400;

  for (let step = 0; step < maxSteps; step += 1) {
    const currentDate = await getCurrentDate(page);
    if (currentDate === targetDate) {
      return;
    }

    const diff = daysBetween(currentDate, targetDate);
    if (diff > 0) {
      await page.getByTestId('water-sales-date-next').click();
    } else {
      await page.getByTestId('water-sales-date-prev').click();
    }
  }

  throw new Error(
    `Could not reach target date ${targetDate} within ${maxSteps} steps`
  );
}

async function deleteSaleById(page: Page, saleId: string): Promise<boolean> {
  const row = page.getByTestId(`sale-row-${saleId}`);
  if ((await row.count()) === 0) {
    return false;
  }

  await expect(row).toBeVisible();
  const deleteTrigger = page.getByTestId(`sale-delete-trigger-${saleId}`);
  await expect(deleteTrigger).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await deleteTrigger.click();
      break;
    } catch {
      if (attempt === 2) {
        await deleteTrigger.click({ force: true });
        break;
      }
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(300);
    }
  }

  const confirmDeleteButton = page.getByTestId('sale-delete-confirm');
  await expect(confirmDeleteButton).toBeVisible();
  await expect(confirmDeleteButton).toBeEnabled();
  await confirmDeleteButton.click();
  await expect(page.getByTestId(`sale-row-${saleId}`)).toHaveCount(0);

  return true;
}

test(
  'purges all existing discoverable water sales and validates zero in transactions',
  documented({
    intent:
      'Comprobar que las ventas se pueden borrar desde la interfaz y que no dejan rastro.',
    steps: [
      'Siembra 3 ventas directo en la base: 2 de hoy (Bs 700 y Bs 1400) y 1 de ayer (Bs 700).',
      'Abre Agua y va a la fecha de cada venta.',
      'Borra cada venta con su botón de eliminar y «Eliminar Permanentemente» del drawer.',
      'Abre Transacciones.',
    ],
    expects: [
      'Al empezar la base tiene exactamente 3 ventas.',
      'Al final la base tiene 0 ventas.',
      'Transacciones no muestra ninguna «Venta de Agua».',
    ],
    data: 'Ventas sembradas: Bs 700, Bs 1400 y Bs 700, con tasa 1000.',
  }),
  async ({ page }) => {
    test.setTimeout(5 * 60_000);

    // Every test starts from an empty database, so seed the sales this test deletes.
    const today = todayVe();
    await seedSales([
      { date: today, dailyNumber: 1, totalBs: 700, exchangeRate: 1000 },
      { date: today, dailyNumber: 2, totalBs: 1400, exchangeRate: 1000 },
      {
        date: addDays(today, -1),
        dailyNumber: 1,
        totalBs: 700,
        exchangeRate: 1000,
      },
    ]);

    const initialDiscoverableCount = await countDiscoverableSales();
    expect(initialDiscoverableCount).toBe(3);
    let remainingSales = await listDiscoverableSales();

    await gotoDashboard(page);
    await openWaterSalesFromBottomNav(page);

    let deletedCount = 0;
    const safetyCycles = 50;

    for (let cycle = 0; cycle < safetyCycles; cycle += 1) {
      if (remainingSales.length === 0) {
        break;
      }

      const uniqueDates = [
        ...new Set(remainingSales.map((sale) => sale.date)),
      ].sort();

      for (const date of uniqueDates) {
        await navigateToDate(page, date);

        const idsForDate = remainingSales
          .filter((sale) => sale.date === date)
          .map((sale) => sale.id);

        for (const saleId of idsForDate) {
          const deleted = await deleteSaleById(page, saleId);
          if (deleted) {
            deletedCount += 1;
          }
        }
      }

      remainingSales = await listDiscoverableSales();
    }

    await expect
      .poll(async () => {
        return countDiscoverableSales();
      })
      .toBe(0);

    const finalDiscoverableCount = await countDiscoverableSales();
    expect(finalDiscoverableCount).toBe(0);

    await openTransactionsFromMenu(page);
    await expect(page.getByText('Venta de Agua')).toHaveCount(0);

    test.info().annotations.push({
      type: 'evidence',
      description: `Deleted ${deletedCount} discoverable sales (initial count ${initialDiscoverableCount}) and DB count reached ${finalDiscoverableCount}`,
    });
  }
);
