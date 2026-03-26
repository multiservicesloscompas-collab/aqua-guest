import { expect, Locator, Page } from '@playwright/test';
import { getE2EBaseUrl } from './env';
import { waitForAppReady } from './waitForAppReady';

const baseUrl = getE2EBaseUrl();

const NAV_LABELS = {
  waterSales: 'Ir a Agua',
  dashboard: 'Ir a Inicio',
  moreOptions: 'Abrir más opciones',
  transactions: 'Ir a Transacciones',
} as const;

const DESKTOP_BUTTONS = {
  waterSales: 'Agua',
  dashboard: 'Inicio',
} as const;

const APP_ROUTES = {
  dashboard: new RegExp(`^${baseUrl.replace(/\./g, '\\.')}/?$`),
};

async function clickFirstVisible(
  candidates: readonly Locator[],
  debugLabel = 'element'
): Promise<void> {
  // Poll until at least one element is visible
  await expect
    .poll(
      async () => {
        for (let i = 0; i < candidates.length; i++) {
          const element = candidates[i].first();
          try {
            if (await element.isVisible({ timeout: 500 })) {
              return i;
            }
          } catch {
            // Element not visible or doesn't exist yet
            continue;
          }
        }
        return -1;
      },
      { timeout: 15_000 }
    )
    .not.toBe(-1);

  // Click the first visible element
  for (const candidate of candidates) {
    const element = candidate.first();
    if (await element.isVisible()) {
      await element.click();
      return;
    }
  }
}

export async function gotoDashboard(page: Page): Promise<void> {
  await page.goto(baseUrl + '/');
  await expect(page).toHaveURL(APP_ROUTES.dashboard);
  await waitForAppReady(page);
}

export async function openWaterSalesFromBottomNav(page: Page): Promise<void> {
  const addProductFab = page.getByTestId('water-sales-add-product-fab');
  if (await addProductFab.first().isVisible()) {
    return;
  }

  const mobileNavButton = page.getByLabel(NAV_LABELS.waterSales);
  const tabletNavButton = page.getByRole('button', {
    name: DESKTOP_BUTTONS.waterSales,
  });

  try {
    await clickFirstVisible([mobileNavButton, tabletNavButton]);
  } catch {
    await gotoDashboard(page);
    await clickFirstVisible([mobileNavButton, tabletNavButton]);
  }
  await expect(addProductFab).toBeVisible();
}

export async function openTransactionsFromMenu(page: Page): Promise<void> {
  const mobileMenuButton = page.getByLabel(NAV_LABELS.moreOptions);
  if (await mobileMenuButton.first().isVisible()) {
    await mobileMenuButton.click();
    await page.getByLabel(NAV_LABELS.transactions).click();
  } else {
    await openDashboardFromBottomNav(page);
    await page.getByTestId('dashboard-kpi-transactions').click();
  }

  await expect(
    page.getByRole('heading', { name: 'Transacciones', exact: true })
  ).toBeVisible();
}

export async function openDashboardFromBottomNav(page: Page): Promise<void> {
  if ((await page.getByTestId('dashboard-kpi-mtd-income-value').count()) > 0) {
    await waitForAppReady(page);
    return;
  }

  const mobileNavButton = page.getByLabel(NAV_LABELS.dashboard);
  const tabletNavButton = page.getByRole('button', {
    name: DESKTOP_BUTTONS.dashboard,
  });

  await clickFirstVisible([mobileNavButton, tabletNavButton]);

  await waitForAppReady(page);
}
