import { expect, test } from '@playwright/test';
import { addDays, todayVe } from '../../support/bugs/dates';
import {
  firstMachineId,
  seedRental,
  setExchangeRate,
} from '../../support/bugs/dbSeed';
import { bugDoc } from '../../support/bugs/ficha';
import { snapshotTodayRate, useCleanDomain } from '../../support/bugs/setup';
import { delayRoute } from '../../support/bugs/networkFaults';
import { openRentalsModule } from '../../support/drivers/rentalDriver';
import { parseUniversalMoney } from '../../support/money';
import { getSupabaseClient } from '../../support/supabaseClient';
import { gotoDashboard } from '../../support/uiNavigation';

useCleanDomain();

async function seedPaidRentalWithSplit(opts: {
  amountBs: number;
  amountUsd: number;
  rateUsed: number;
}): Promise<string> {
  const today = todayVe();
  const id = await seedRental({
    date: today,
    machineId: await firstMachineId(),
    shift: 'completo',
    deliveryTime: '09:00',
    pickupDate: addDays(today, 1),
    pickupTime: '09:00',
    totalUsd: opts.amountUsd,
    isPaid: true,
    datePaid: today,
  });
  const { error } = await getSupabaseClient()
    .from('rental_payment_splits')
    .insert({
      rental_id: id,
      payment_method: 'efectivo',
      amount_bs: opts.amountBs,
      amount_usd: opts.amountUsd,
      exchange_rate_used: opts.rateUsed,
    });
  if (error) throw new Error(error.message);
  return id;
}

test.describe('Alquileres (rojos)', () => {
  test(
    '[B4] the payment-method detail shows what the rental was paid',
    bugDoc({
      id: 'B4',
      titulo:
        'El detalle del método de pago muestra lo que se pagó, no la tasa de hoy',
      intent:
        'Comprobar que el detalle de Efectivo muestra el monto histórico de un alquiler pagado aunque la tasa haya cambiado.',
      steps: [
        'Siembra un alquiler de $5 pagado en efectivo con tasa 36.5 (Bs 182.50).',
        'Cambia la tasa de hoy a 50.',
        'Abre el detalle de la tarjeta de Efectivo.',
      ],
      expects: ['El alquiler aparece con Bs 182.50.'],
      actual:
        'con un solo pago guardado el detalle no usa el pago y recalcula $5 × 50 = Bs 250',
    }),
    async ({ page }) => {
      const restore = await snapshotTodayRate();
      try {
        // Arrange
        await setExchangeRate(todayVe(), 36.5);
        await seedPaidRentalWithSplit({
          amountBs: 182.5,
          amountUsd: 5,
          rateUsed: 36.5,
        });
        await setExchangeRate(todayVe(), 50);

        // Act
        await gotoDashboard(page);
        await page.getByTestId('dashboard-method-card-efectivo').click();
        const row = page
          .locator('[data-testid^="payment-method-transaction-row-"]')
          .first();
        await expect(row).toBeVisible({ timeout: 10_000 });

        // Assert
        const amount = row.getByText(/^Bs\s[\d.,]+$/).first();
        expect(parseUniversalMoney(await amount.innerText())).toBeCloseTo(
          182.5,
          1
        );
      } finally {
        await restore();
      }
    }
  );

  test(
    '[B7] the edit sheet prices the Completo shift like the create sheet',
    bugDoc({
      id: 'B7',
      titulo: 'La edición muestra el precio correcto del turno completo',
      intent:
        'Comprobar que, para un alquiler pagado en efectivo, la edición muestra el turno Completo a $6 (solo en divisa cuesta $5).',
      steps: [
        'Siembra un alquiler de turno completo pagado en efectivo.',
        'Abre la edición del alquiler y lee el texto de la opción «Completo».',
      ],
      expects: ['La opción Completo dice $6.'],
      actual:
        'la edición aplica la regla de divisa al revés y muestra $5 para efectivo',
    }),
    async ({ page }) => {
      // Arrange
      const today = todayVe();
      const id = await seedPaidRentalWithSplit({
        amountBs: 240,
        amountUsd: 6,
        rateUsed: 40,
      });
      expect(id).toBeTruthy();
      await gotoDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId(`rental-edit-${id}`).click();
      const option = page.getByTestId('rental-shift-option-completo');
      await expect(option).toBeVisible();

      // Assert
      await expect(option).toContainText('$6');
      expect(today).toBeTruthy();
    }
  );

  test(
    '[B2] what you type in the edit sheet survives a background refresh',
    bugDoc({
      id: 'B2',
      titulo: 'Lo que escribes en la edición no se borra cuando llega la tasa',
      intent:
        'Comprobar que el formulario de edición de un alquiler no se reinicia cuando la tasa de cambio termina de cargar en segundo plano.',
      steps: [
        'Siembra un alquiler y retrasa 6 segundos la respuesta de la tasa de cambio.',
        'Abre la edición del alquiler y escribe una nota.',
        'Espera a que llegue la tasa.',
      ],
      expects: ['La nota sigue escrita en el formulario.'],
      actual:
        'el formulario se reinicia con cada cambio de la tasa o de los alquileres y borra lo que el usuario escribió',
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
});
