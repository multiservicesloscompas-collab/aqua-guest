import { documented, expect, test } from '../support/fixtures';
import { BASELINE_CUSTOMERS } from '../support/reset/baseline';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';

const AREA = 'Clientes';
const BASE = BASELINE_CUSTOMERS.length;

async function openCustomers(page: import('@playwright/test').Page) {
  await gotoDashboard(page);
  await page.getByLabel('Abrir más opciones').click();
  await page.getByLabel('Ir a Clientes').click();
  await expect(page.getByTestId('customers-add-fab')).toBeVisible();
}

async function customerIdByName(name: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from('customers')
    .select('id')
    .eq('name', name)
    .single();
  if (error || !data) throw new Error(`Customer not found: ${name}`);
  return data.id as string;
}

async function customerCount(): Promise<number> {
  const { count } = await getSupabaseClient()
    .from('customers')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

test.describe('customers screen', () => {
  test(
    'create a customer',
    documented({
      titulo: 'Crear un cliente nuevo',
      area: AREA,
      intent: 'Comprobar que un cliente nuevo se guarda y aparece en la lista.',
      steps: [
        'Abre Clientes y pulsa el botón de agregar.',
        'Escribe nombre, teléfono y dirección y pulsa «Guardar Cliente».',
      ],
      expects: [
        `La base pasa de ${BASE} a ${BASE + 1} clientes.`,
        'El cliente nuevo aparece en la lista con su nombre.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openCustomers(page);

      // Act
      await page.getByTestId('customers-add-fab').click();
      await page
        .getByPlaceholder('Nombre del cliente')
        .fill('Cliente Nuevo E2E');
      await page.getByPlaceholder('Número de teléfono').fill('04141234567');
      await page.getByPlaceholder('Dirección').fill('Calle Nueva 1');
      await page.getByRole('button', { name: 'Guardar Cliente' }).click();

      // Assert
      await expect.poll(customerCount).toBe(BASE + 1);
      const id = await customerIdByName('Cliente Nuevo E2E');
      await expect(page.getByTestId(`customer-row-${id}`)).toContainText(
        'Cliente Nuevo E2E'
      );
    }
  );

  test(
    'search customers',
    documented({
      titulo: 'Buscar clientes por nombre',
      area: AREA,
      intent:
        'Comprobar que el buscador filtra la lista y muestra el aviso cuando no hay coincidencias.',
      steps: [
        'Abre Clientes (hay 4 de la línea base).',
        'Busca «Prueba 2».',
        'Busca un texto que no existe.',
      ],
      expects: [
        'Con «Prueba 2» queda un solo cliente: Cliente Prueba 2.',
        'Con el texto inexistente aparece «No se encontraron clientes».',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openCustomers(page);
      const search = page.getByTestId('customers-search-input');

      // Act
      await search.fill('Prueba 2');
      const id = await customerIdByName('Cliente Prueba 2');

      // Assert
      await expect(page.locator('[data-testid^="customer-row-"]')).toHaveCount(
        1
      );
      await expect(page.getByTestId(`customer-row-${id}`)).toBeVisible();
      await search.fill('zzz inexistente');
      await expect(page.getByTestId('customers-empty-state')).toContainText(
        'No se encontraron clientes'
      );
    }
  );

  test(
    'edit a customer',
    documented({
      titulo: 'Editar el nombre de un cliente',
      area: AREA,
      intent: 'Comprobar que editar un cliente guarda el cambio en la base.',
      steps: [
        'Abre Clientes y pulsa editar en Cliente Prueba 1.',
        'Cambia el nombre a «Cliente Editado E2E» y pulsa «Guardar Cambios».',
      ],
      expects: [
        'La base tiene un cliente llamado «Cliente Editado E2E» con el mismo id.',
        'La cantidad de clientes sigue igual.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openCustomers(page);
      const id = await customerIdByName('Cliente Prueba 1');

      // Act
      await page.getByTestId(`customer-edit-${id}`).click();
      await page
        .getByPlaceholder('Nombre del cliente')
        .fill('Cliente Editado E2E');
      await page.getByRole('button', { name: 'Guardar Cambios' }).click();

      // Assert
      await expect
        .poll(
          async () =>
            (await customerIdByName('Cliente Editado E2E').catch(() => '')) ===
            id
        )
        .toBe(true);
      expect(await customerCount()).toBe(BASE);
    }
  );

  test(
    'delete a customer',
    documented({
      titulo: 'Eliminar un cliente (con cancelar y con confirmar)',
      area: AREA,
      intent:
        'Comprobar que cancelar no borra y que confirmar sí borra al cliente.',
      steps: [
        'Abre Clientes y pulsa eliminar en Cliente Prueba 3; en el diálogo pulsa Cancelar.',
        'Vuelve a pulsar eliminar y esta vez confirma.',
      ],
      expects: [
        `Tras cancelar siguen ${BASE} clientes.`,
        `Tras confirmar quedan ${
          BASE - 1
        } clientes y Cliente Prueba 3 ya no está en la base.`,
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openCustomers(page);
      const id = await customerIdByName('Cliente Prueba 3');

      // Act
      await page.getByTestId(`customer-delete-${id}`).click();
      await page.getByTestId('confirm-delete-cancel').click();
      const afterCancel = await customerCount();
      await page.getByTestId(`customer-delete-${id}`).click();
      await page.getByTestId('confirm-delete-confirm').click();

      // Assert
      expect(afterCancel).toBe(BASE);
      await expect.poll(customerCount).toBe(BASE - 1);
      await expect(page.getByTestId(`customer-row-${id}`)).toHaveCount(0);
    }
  );
});
