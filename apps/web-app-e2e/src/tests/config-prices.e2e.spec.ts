import { documented, expect, test } from '../support/fixtures';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';
import type { Page } from '@playwright/test';

const AREA = 'Precios';

async function deepWashPriceInDb(): Promise<number> {
  const { data, error } = await getSupabaseClient()
    .from('products')
    .select('default_price')
    .ilike('name', '%lavado%')
    .single();
  if (error || !data) throw new Error('Lavado profundo product not found');
  return Number(data.default_price);
}

async function openPricesPage(page: Page) {
  await gotoDashboard(page);
  await page.getByLabel('Ir a Agua').click();
  await page.getByLabel('Abrir submenú del módulo').click();
  await page.getByLabel('Ir a Precios').click();
  await expect(
    page.getByText('Precio unitario por servicio de lavado').first()
  ).toBeVisible();
}

async function saveDeepWashPrice(page: Page, price: number) {
  await page.locator('input[type="number"]').last().fill(String(price));
  await page
    .getByRole('button', { name: 'Guardar Precio', exact: true })
    .click();
}

test.describe('precios del lavado profundo', () => {
  test(
    'saving the deep-wash price online reaches the database',
    documented({
      titulo:
        'Guardar el precio del lavado profundo con conexión llega a la base',
      area: AREA,
      intent:
        'Comprobar que el guardado con conexión funciona, como referencia del caso sin conexión.',
      steps: ['Abre Precios, escribe 2500 en Lavado profundo y guarda.'],
      expects: ['El producto queda con precio 2500 en la base.'],
    }),
    async ({ page }) => {
      // Arrange
      await openPricesPage(page);

      // Act
      await saveDeepWashPrice(page, 2500);

      // Assert
      await expect.poll(deepWashPriceInDb, { timeout: 10_000 }).toBe(2500);
    }
  );

  test(
    'a price saved while offline reaches the database when the connection returns',
    documented({
      titulo:
        '[B8 corregido] El precio del lavado profundo guardado sin conexión se sincroniza al volver',
      area: AREA,
      intent:
        'Comprobar que un cambio de precio hecho sin internet no se pierde: al volver la conexión llega a la base.',
      steps: [
        'Abre Precios con conexión y luego corta la conexión.',
        'Escribe 2500 en Lavado profundo y guarda.',
        'Restablece la conexión y espera la sincronización.',
      ],
      expects: ['El producto queda con precio 2500 en la base.'],
    }),
    async ({ page, context }) => {
      // Arrange
      await openPricesPage(page);
      const before = await deepWashPriceInDb();

      // Act
      await context.setOffline(true);
      await saveDeepWashPrice(page, 2500);
      await context.setOffline(false);

      // Assert
      expect(before).not.toBe(2500);
      await expect.poll(deepWashPriceInDb, { timeout: 30_000 }).toBe(2500);
    }
  );
});
