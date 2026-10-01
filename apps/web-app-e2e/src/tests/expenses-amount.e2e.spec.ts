import { documented, expect, test } from '../support/fixtures';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';

test(
  'an expense with amount 0 is not saved',
  documented({
    titulo: '[FIN-10 corregido] Un egreso de monto 0 no se registra',
    area: 'Egresos',
    intent: 'Comprobar que el formulario no permite guardar un egreso de Bs 0.',
    steps: [
      'Abre Egresos, escribe monto 0 y una descripción.',
      'Intenta guardar.',
    ],
    expects: [
      'El botón de guardar queda desactivado y no se crea ningún egreso.',
    ],
    data: 'Descripción «E2E cero» con monto 0.',
  }),
  async ({ page }) => {
    // Arrange
    await gotoDashboard(page);
    await page.getByLabel('Abrir más opciones').click();
    await page.getByLabel('Ir a Egresos').click();
    await page.getByTestId('expenses-add-fab').click();
    await page.locator('input[type="number"]').first().fill('0');
    await page.getByPlaceholder('Ej: Compra de insumos').fill('E2E cero');
    const submit = page.getByTestId('expense-submit-button');

    // Act
    if (await submit.isEnabled()) await submit.click();
    await page.waitForTimeout(1_500);

    // Assert
    await expect(submit).toBeDisabled();
    const { count } = await getSupabaseClient()
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('description', 'E2E cero');
    expect(count).toBe(0);
  }
);
