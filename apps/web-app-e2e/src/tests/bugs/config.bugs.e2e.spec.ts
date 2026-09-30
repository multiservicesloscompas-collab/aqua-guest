import { expect, test, type Page } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { useCleanDomain } from '../../support/bugs/setup';
import { getSupabaseClient } from '../../support/supabaseClient';
import { gotoDashboard } from '../../support/uiNavigation';

useCleanDomain();

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

test.describe('Configuración (rojos)', () => {
  test(
    '[B8-control] saving the deep-wash price online reaches the database',
    bugDoc({
      id: 'B8',
      control: true,
      titulo:
        'Guardar el precio del lavado profundo con conexión llega a la base',
      intent:
        'Fijar que el guardado con conexión funciona, para acotar el bug al modo sin conexión.',
      steps: ['Abre Precios, escribe 2500 en Lavado profundo y guarda.'],
      expects: ['El producto queda con precio 2500 en la base.'],
      actual: 'no aplica',
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
    '[B8] a price saved while offline reaches the database when the connection returns',
    bugDoc({
      id: 'B8',
      titulo:
        'El precio del lavado profundo guardado sin conexión se sincroniza al volver',
      intent:
        'Comprobar que un cambio de precio hecho sin internet no se pierde: al volver la conexión llega a la base.',
      steps: [
        'Abre Precios con conexión y luego corta la conexión.',
        'Escribe 2500 en Lavado profundo y guarda.',
        'Restablece la conexión y espera la sincronización.',
      ],
      expects: ['El producto queda con precio 2500 en la base.'],
      actual:
        'sin conexión el guardado solo cambia el estado local y no deja nada en la cola de sincronización',
    }),
    async ({ page, context }) => {
      // Arrange
      const before = await (async () => {
        await openPricesPage(page);
        return deepWashPriceInDb();
      })();

      // Act
      await context.setOffline(true);
      await saveDeepWashPrice(page, 2500);
      await context.setOffline(false);
      await page.waitForTimeout(8_000);

      // Assert
      expect(before).not.toBe(2500);
      expect(await deepWashPriceInDb()).toBe(2500);
    }
  );
});
