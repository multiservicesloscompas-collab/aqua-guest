import type { Page } from '@playwright/test';
import { documented, expect, test } from '../support/fixtures';
import { BASELINE_MACHINES } from '../support/reset/baseline';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';

const AREA = 'Lavadoras (gestión de máquinas)';
const BASE = BASELINE_MACHINES.length;

async function openMachines(page: Page) {
  await gotoDashboard(page);
  await page.getByLabel('Ir a Lavadoras').click();
  await page.getByLabel('Abrir submenú del módulo').click();
  await page.getByLabel('Ir a Gestión de Máquinas').click();
  await expect(page.getByTestId('machines-add-button')).toBeVisible();
}

async function machineByName(name: string) {
  const { data, error } = await getSupabaseClient()
    .from('washing_machines')
    .select('id,name,kg,brand,status')
    .eq('name', name)
    .single();
  if (error || !data) throw new Error(`Machine not found: ${name}`);
  return data as {
    id: string;
    name: string;
    kg: number;
    brand: string;
    status: string;
  };
}

async function machineCount(): Promise<number> {
  const { count } = await getSupabaseClient()
    .from('washing_machines')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

test.describe('machines screen', () => {
  test(
    'create a machine',
    documented({
      titulo: 'Crear una lavadora nueva',
      area: AREA,
      intent:
        'Comprobar que una lavadora nueva se guarda con su capacidad y marca.',
      steps: [
        'Abre Gestión de Máquinas y pulsa agregar.',
        'Escribe nombre «Lavadora 6», 20 kg y marca «Samsung» y guarda.',
      ],
      expects: [
        `La base pasa de ${BASE} a ${BASE + 1} lavadoras.`,
        'Lavadora 6 tiene 20 kg y marca Samsung.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openMachines(page);

      // Act
      await page.getByTestId('machines-add-button').click();
      await page.getByTestId('machine-form-name').fill('Lavadora 6');
      await page.getByTestId('machine-form-kg').fill('20');
      await page.getByTestId('machine-form-brand').fill('Samsung');
      await page.getByTestId('machine-form-submit').click();

      // Assert
      await expect.poll(machineCount).toBe(BASE + 1);
      const machine = await machineByName('Lavadora 6');
      expect(machine.kg).toBe(20);
      expect(machine.brand).toBe('Samsung');
      await expect(
        page.getByTestId(`machine-card-${machine.id}`)
      ).toContainText('Lavadora 6');
    }
  );

  test(
    'edit a machine',
    documented({
      titulo: 'Editar el nombre y la capacidad de una lavadora',
      area: AREA,
      intent: 'Comprobar que editar una lavadora guarda los cambios.',
      steps: [
        'Abre Gestión de Máquinas y pulsa editar en Lavadora 1.',
        'Cambia el nombre a «Lavadora Editada» y la capacidad a 25 kg y guarda.',
      ],
      expects: [
        'La misma lavadora (mismo id) se llama «Lavadora Editada» y tiene 25 kg.',
        'La cantidad de lavadoras sigue igual.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openMachines(page);
      const { id } = await machineByName('Lavadora 1');

      // Act
      await page.getByTestId(`machine-edit-${id}`).click();
      await page.getByTestId('machine-form-name').fill('Lavadora Editada');
      await page.getByTestId('machine-form-kg').fill('25');
      await page.getByTestId('machine-form-submit').click();

      // Assert
      await expect
        .poll(
          async () =>
            (
              await machineByName('Lavadora Editada').catch(() => null)
            )?.id
        )
        .toBe(id);
      expect((await machineByName('Lavadora Editada')).kg).toBe(25);
      expect(await machineCount()).toBe(BASE);
    }
  );

  test(
    'delete a machine',
    documented({
      titulo: 'Eliminar una lavadora (con cancelar y con confirmar)',
      area: AREA,
      intent:
        'Comprobar que cancelar no borra y que confirmar sí borra la lavadora.',
      steps: [
        'Abre Gestión de Máquinas y pulsa eliminar en Lavadora 2; en el diálogo pulsa Cancelar.',
        'Vuelve a pulsar eliminar y confirma.',
      ],
      expects: [
        `Tras cancelar siguen ${BASE} lavadoras.`,
        `Tras confirmar quedan ${BASE - 1} y Lavadora 2 ya no está.`,
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openMachines(page);
      const { id } = await machineByName('Lavadora 2');

      // Act
      await page.getByTestId(`machine-delete-${id}`).click();
      await page.getByTestId('confirm-delete-cancel').click();
      const afterCancel = await machineCount();
      await page.getByTestId(`machine-delete-${id}`).click();
      await page.getByTestId('confirm-delete-confirm').click();

      // Assert
      expect(afterCancel).toBe(BASE);
      await expect.poll(machineCount).toBe(BASE - 1);
      await expect(page.getByTestId(`machine-card-${id}`)).toHaveCount(0);
    }
  );
});
