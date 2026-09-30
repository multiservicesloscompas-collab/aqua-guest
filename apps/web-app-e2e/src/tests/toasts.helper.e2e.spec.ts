import { expect, test } from '@playwright/test';
import { documented } from '../support/testDoc';
import { expectToast } from '../support/toasts';

// Pure UI check: it does not open the app and does not touch the database.
const MESSAGE = '¡Venta registrada correctamente!';

const toast = (text: string) => `<div class="toast">${text}</div>`;

test.describe('expectToast helper', () => {
  test(
    'a bare getByText fails when two toasts show the same text',
    documented({
      intent:
        'Demostrar por qué un getByText desnudo no sirve para comprobar un aviso.',
      steps: [
        'Monta una página con dos avisos idénticos, como cuando el aviso de la venta anterior sigue en pantalla.',
        'Intenta comprobar el aviso con getByText y toBeVisible.',
      ],
      expects: [
        'Playwright falla con «strict mode violation» porque hay dos elementos con ese texto.',
      ],
    }),
    async ({ page }) => {
      // Arrange: the previous sale toast is still visible when the next one appears
      await page.setContent(toast(MESSAGE) + toast(MESSAGE));

      // Act
      const bare = expect(page.getByText(MESSAGE)).toBeVisible({
        timeout: 500,
      });

      // Assert
      await expect(bare).rejects.toThrow(/strict mode violation/);
    }
  );

  test(
    'expectToast passes when two toasts show the same text',
    documented({
      intent: 'Comprobar que expectToast tolera avisos duplicados.',
      steps: [
        'Monta una página con dos avisos idénticos.',
        'Comprueba el aviso con expectToast.',
      ],
      expects: ['No falla: basta con que alguno de los avisos esté visible.'],
    }),
    async ({ page }) => {
      // Arrange
      await page.setContent(toast(MESSAGE) + toast(MESSAGE));

      // Act / Assert
      await expectToast(page, MESSAGE);
    }
  );

  test(
    'expectToast passes with a single toast',
    documented({
      intent: 'Comprobar que expectToast sigue funcionando con un solo aviso.',
      steps: [
        'Monta una página con un solo aviso.',
        'Comprueba el aviso con expectToast.',
      ],
      expects: ['Pasa.'],
    }),
    async ({ page }) => {
      // Arrange
      await page.setContent(toast(MESSAGE));

      // Act / Assert
      await expectToast(page, MESSAGE);
    }
  );

  test(
    'expectToast still fails when no toast shows the text',
    documented({
      intent:
        'Comprobar que expectToast no da por bueno un aviso que no aparece.',
      steps: [
        'Monta una página con un aviso distinto al esperado.',
        'Comprueba el aviso esperado con expectToast y solo 500 ms de espera.',
      ],
      expects: ['Falla, porque ningún aviso muestra el texto esperado.'],
    }),
    async ({ page }) => {
      // Arrange
      await page.setContent(toast('Otro aviso'));

      // Act
      const missing = expectToast(page, MESSAGE, { timeout: 500 });

      // Assert
      await expect(missing).rejects.toThrow(/toBeVisible/);
    }
  );
});
