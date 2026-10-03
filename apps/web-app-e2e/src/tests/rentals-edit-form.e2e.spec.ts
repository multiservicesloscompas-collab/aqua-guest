import { seedPaidRentalWithSplit } from '../support/bugs/dbSeed';
import { delayRoute } from '../support/bugs/networkFaults';
import { openRentalsModule } from '../support/drivers/rentalDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';

test(
  'what you type in the edit sheet survives a background refresh',
  documented({
    titulo:
      '[B2 corregido] Lo que escribes en la edición no se borra cuando llega la tasa',
    area: 'Alquileres',
    intent:
      'Comprobar que el formulario de edición de un alquiler no se reinicia cuando la tasa de cambio termina de cargar en segundo plano.',
    steps: [
      'Siembra un alquiler y retrasa 6 segundos la respuesta de la tasa de cambio.',
      'Abre la edición del alquiler y escribe una nota.',
      'Espera a que llegue la tasa.',
    ],
    expects: ['La nota sigue escrita en el formulario.'],
    data: 'Alquiler turno completo pagado en efectivo; tasa de cambio retrasada 6 s.',
  }),
  async ({ page }) => {
    // Arrange
    const id = await seedPaidRentalWithSplit({
      amountBs: 240,
      amountUsd: 6,
      rateUsed: 40,
    });
    await delayRoute(page, 'exchange_rates', 'GET', () => 6_000);
    await gotoDashboard(page);
    await openRentalsModule(page);
    await page.getByTestId(`rental-edit-${id}`).click();
    const notes = page.getByPlaceholder('Observaciones...');
    await expect(notes).toBeVisible();

    // Act
    await notes.fill('nota escrita por el usuario');
    await page.waitForTimeout(8_000); // the delayed rate arrives in the meantime

    // Assert
    await expect(notes).toHaveValue('nota escrita por el usuario');
  }
);

test(
  'the edit sheet prices the Completo shift like the create sheet',
  documented({
    titulo:
      '[B7 corregido] La edición muestra el precio correcto del turno completo',
    area: 'Alquileres',
    intent:
      'Comprobar que, para un alquiler pagado en efectivo, la edición muestra el turno Completo a $6 (solo en divisa cuesta $5).',
    steps: [
      'Siembra un alquiler de turno completo pagado en efectivo.',
      'Abre la edición del alquiler y lee el texto de la opción «Completo».',
    ],
    expects: ['La opción Completo dice $6.'],
    data: 'Alquiler turno completo pagado en efectivo.',
  }),
  async ({ page }) => {
    // Arrange
    const id = await seedPaidRentalWithSplit({
      amountBs: 240,
      amountUsd: 6,
      rateUsed: 40,
    });
    await gotoDashboard(page);
    await openRentalsModule(page);

    // Act
    await page.getByTestId(`rental-edit-${id}`).click();
    const option = page.getByTestId('rental-shift-option-completo');
    await expect(option).toBeVisible();

    // Assert
    await expect(option).toContainText('$6');
  }
);
