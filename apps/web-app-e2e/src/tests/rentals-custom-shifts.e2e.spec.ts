import { todayVe } from '../support/bugs/dates';
import {
  firstMachineId,
  seedCustomer,
  seedRental,
} from '../support/bugs/dbSeed';
import {
  createWasherRental,
  editRental,
  openRentalsModule,
  pickDeliveryTime,
} from '../support/drivers/rentalDriver';
import {
  readLatestRental,
  readRentalById,
  readRentals,
  seedRentalShift,
  updateShiftInDb,
} from '../support/drivers/shiftsDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

const AREA = 'Alquileres con turnos del catálogo';

const NOCTURNO = {
  code: 'NOCTURNO',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 4,
  divisaDiscountUsd: 1,
};

async function seedNocturno(): Promise<string> {
  return seedRentalShift(NOCTURNO);
}

async function createRentalWith(
  page: Parameters<typeof createWasherRental>[0],
  shift: string,
  method: 'efectivo' | 'divisa' = 'efectivo'
) {
  await createWasherRental(page, {
    shift,
    totalUsd: 0,
    isPaid: false,
    splits: [{ method, amountBs: 0 }],
    customerName: `Cliente ${shift} ${Date.now()}`,
  });
}

test.describe('rentals with catalog shifts', () => {
  test(
    'the new rental sheet offers the catalog shifts with their price',
    documented({
      titulo: 'La hoja de alquiler nuevo ofrece los turnos del catálogo',
      area: AREA,
      intent:
        'Comprobar que un turno creado aparece al registrar un alquiler, con su precio y el de divisa.',
      steps: [
        'Crea el turno «Nocturno» a $5 con $1 de descuento en divisa.',
        'Abre Alquileres y el formulario de nuevo alquiler.',
        'Cambia el método de pago a divisa.',
      ],
      expects: [
        'Aparecen los tres turnos base y Nocturno.',
        'Nocturno muestra $5 y, con divisa, $4.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId('rentals-add-fab').click();
      const option = page.getByTestId(`rental-shift-option-${shiftId}`);

      // Assert
      await expect(option).toContainText('Nocturno');
      await expect(option).toContainText('$5');
      await expect(page.getByTestId('rental-shift-option-medio')).toBeVisible();
      await expect(
        page.getByTestId('rental-shift-option-completo')
      ).toBeVisible();
      await expect(page.getByTestId('rental-shift-option-doble')).toBeVisible();

      await page.getByTestId('rental-payment-method-divisa').click();
      await expect(option).toContainText('$4');
    }
  );

  test(
    'a rental of a custom shift stores its snapshot and price',
    documented({
      titulo: 'Un alquiler de un turno nuevo guarda su snapshot y su precio',
      area: AREA,
      intent:
        'Comprobar que el alquiler guarda el id del turno y copia nombre, horas, precio y descuento.',
      steps: [
        'Crea el turno «Nocturno» (4 horas, $5, $1 de descuento en divisa).',
        'Registra un alquiler de Nocturno pagado en efectivo.',
      ],
      expects: [
        'El alquiler apunta al id del turno.',
        'Guarda Nocturno, 4 horas, $5 y $1 de regla de descuento.',
        'El total es $5.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);

      // Act
      await createRentalWith(page, 'Nocturno');

      // Assert
      const rental = await readLatestRental();
      expect(rental).toMatchObject({
        shift: shiftId,
        label: 'Nocturno',
        hours: 4,
        priceUsd: 5,
        divisaDiscountUsd: 1,
        totalUsd: 5,
      });
    }
  );

  test(
    'a custom shift applies its divisa discount only when paid in divisa',
    documented({
      titulo: 'El descuento del turno nuevo se aplica solo con divisa',
      area: AREA,
      intent: 'Comprobar la regla de descuento de un turno del catálogo.',
      steps: [
        'Registra un alquiler de Nocturno pagado en divisa.',
        'Registra otro pagado en efectivo.',
      ],
      expects: [
        'El de divisa cuesta $4 y el de efectivo $5.',
        'Ambos guardan la misma regla de descuento de $1.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await seedNocturno();
      await bootstrapAtDashboard(page);

      // Act
      await createRentalWith(page, 'Nocturno', 'divisa');
      await createRentalWith(page, 'Nocturno', 'efectivo');

      // Assert
      const [divisa, efectivo] = await readRentals();
      expect(divisa.totalUsd).toBe(4);
      expect(efectivo.totalUsd).toBe(5);
      expect(divisa.divisaDiscountUsd).toBe(1);
      expect(efectivo.divisaDiscountUsd).toBe(1);
    }
  );

  test(
    'the pickup time follows the hours of the custom shift',
    documented({
      titulo: 'La hora de retiro sigue las horas del turno nuevo',
      area: AREA,
      intent: 'Comprobar que el retiro se calcula con la duración del turno.',
      steps: [
        'Abre el formulario de nuevo alquiler.',
        'Elige Nocturno (4 horas) y entrega a las 09:00.',
      ],
      expects: ['La hora de retiro mostrada es hoy a las 13:00.'],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await openRentalsModule(page);
      await page.getByTestId('rentals-add-fab').click();

      // Act
      await page.getByTestId(`rental-shift-option-${shiftId}`).click();
      await pickDeliveryTime(page, '09:00');

      // Assert
      await expect(page.getByTestId('rental-pickup-label')).toHaveText(
        /^Hoy a las 13:00$/
      );
    }
  );

  test(
    'repricing a shift never changes a rental already registered',
    documented({
      titulo: 'Cambiar el precio de un turno no cambia los alquileres hechos',
      area: AREA,
      intent:
        'Comprobar que el historial conserva el precio con el que se registró.',
      steps: [
        'Registra un alquiler de Nocturno a $5.',
        'Sube el precio de Nocturno a $9 en el catálogo.',
        'Recarga, abre el alquiler viejo y guarda sin cambiar nada.',
        'Registra un alquiler nuevo de Nocturno.',
      ],
      expects: [
        'El alquiler viejo sigue en $5 con precio de snapshot $5.',
        'El alquiler nuevo cuesta $9.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await createRentalWith(page, 'Nocturno');
      const old = await readLatestRental();
      await updateShiftInDb(shiftId, { price_usd: 9 });
      await gotoDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId(`rental-edit-${old.id}`).click();
      await page.getByTestId('rental-confirm-button').click();
      await expect(page.getByTestId('rental-confirm-button')).toBeHidden({
        timeout: 15_000,
      });
      await createRentalWith(page, 'Nocturno');

      // Assert
      expect(await readRentalById(old.id)).toMatchObject({
        totalUsd: 5,
        priceUsd: 5,
      });
      expect((await readLatestRental()).totalUsd).toBe(9);
    }
  );

  test(
    'renaming a shift keeps the old name on registered rentals',
    documented({
      titulo: 'Renombrar un turno conserva el nombre en los alquileres hechos',
      area: AREA,
      intent:
        'Comprobar que la tarjeta del alquiler muestra el nombre original.',
      steps: [
        'Registra un alquiler de Nocturno.',
        'Renombra el turno a «Madrugada» en el catálogo y recarga.',
      ],
      expects: [
        'La tarjeta del alquiler viejo sigue diciendo Nocturno.',
        'El alquiler nuevo muestra Madrugada.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await createRentalWith(page, 'Nocturno');
      const old = await readLatestRental();
      await updateShiftInDb(shiftId, { label: 'Madrugada' });

      // Act
      await gotoDashboard(page);
      await createRentalWith(page, 'Madrugada');
      const fresh = await readLatestRental();
      await openRentalsModule(page);

      // Assert
      await expect(page.getByTestId(`rental-card-${old.id}`)).toContainText(
        'Nocturno'
      );
      await expect(page.getByTestId(`rental-card-${fresh.id}`)).toContainText(
        'Madrugada'
      );
      expect(fresh.label).toBe('Madrugada');
    }
  );

  test(
    'a deleted shift leaves the selector but old rentals keep working',
    documented({
      titulo: 'Un turno eliminado sale del selector pero no rompe lo hecho',
      area: AREA,
      intent:
        'Comprobar que eliminar un turno no deja alquileres viejos sin poder editarse.',
      steps: [
        'Registra un alquiler de Nocturno a $5.',
        'Elimina Nocturno del catálogo y recarga.',
        'Abre el formulario de nuevo alquiler.',
        'Abre la edición del alquiler viejo y guarda sin cambiar nada.',
      ],
      expects: [
        'Nocturno ya no aparece al registrar un alquiler nuevo.',
        'La edición del alquiler viejo sigue ofreciendo Nocturno.',
        'El alquiler viejo conserva su precio y su snapshot.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await createRentalWith(page, 'Nocturno');
      const old = await readLatestRental();
      await updateShiftInDb(shiftId, {
        deleted_at: new Date().toISOString(),
        is_active: false,
      });
      await gotoDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId('rentals-add-fab').click();
      const absentFromNew = await page
        .getByTestId(`rental-shift-option-${shiftId}`)
        .count();
      await page.keyboard.press('Escape');
      await page.getByTestId(`rental-edit-${old.id}`).click();
      const presentInEdit = page.getByTestId(`rental-shift-option-${shiftId}`);

      // Assert
      expect(absentFromNew).toBe(0);
      await expect(presentInEdit).toBeVisible();
      await page.getByTestId('rental-confirm-button').click();
      await expect(page.getByTestId('rental-confirm-button')).toBeHidden({
        timeout: 15_000,
      });
      expect(await readRentalById(old.id)).toMatchObject({
        shift: shiftId,
        totalUsd: 5,
        label: 'Nocturno',
        priceUsd: 5,
      });
    }
  );

  test(
    'switching a rental to a custom shift rewrites its snapshot and total',
    documented({
      titulo: 'Cambiar un alquiler a un turno nuevo reescribe su snapshot',
      area: AREA,
      intent:
        'Comprobar que al elegir otro turno al editar se usan los términos del turno elegido.',
      steps: [
        'Registra un alquiler de Medio Turno ($4).',
        'Edítalo y elige Nocturno.',
      ],
      expects: [
        'El alquiler pasa al id de Nocturno con 4 horas y $5.',
        'El total es $5.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await createRentalWith(page, 'medio');
      const rental = await readLatestRental();
      expect(rental.totalUsd).toBe(4);

      // Act
      await editRental(page, rental.id, { shift: shiftId });

      // Assert
      await expect
        .poll(async () => (await readRentalById(rental.id)).shift)
        .toBe(shiftId);
      expect(await readRentalById(rental.id)).toMatchObject({
        label: 'Nocturno',
        hours: 4,
        priceUsd: 5,
        totalUsd: 5,
      });
    }
  );

  test(
    'repricing Completo does not touch a legacy rental without snapshot',
    documented({
      titulo: 'Subir Completo no toca un alquiler antiguo sin snapshot',
      area: AREA,
      intent:
        'Comprobar el caso de producción: alquileres viejos sin snapshot no cambian cuando se reprecia un turno base.',
      steps: [
        'Siembra un alquiler Completo de $6 sin snapshot, como los de producción.',
        'Sube Completo a $9 en el catálogo.',
        'Abre el alquiler y guarda sin cambiar nada.',
      ],
      expects: [
        'El total sigue en $6.',
        'Las columnas del snapshot siguen vacías.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      const today = todayVe();
      const customerId = await seedCustomer({
        name: 'Cliente Legado',
        phone: '0414-0000001',
        address: 'Calle Prueba #1',
      });
      const rentalId = await seedRental({
        date: today,
        machineId: await firstMachineId(),
        shift: 'completo',
        customerId,
        deliveryTime: '09:00',
        pickupDate: today,
        pickupTime: '17:00',
        totalUsd: 6,
      });
      await updateShiftInDb('completo', { price_usd: 9 });
      await gotoDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId(`rental-edit-${rentalId}`).click();
      await page.getByTestId('rental-confirm-button').click();
      await expect(page.getByTestId('rental-confirm-button')).toBeHidden({
        timeout: 15_000,
      });

      // Assert
      expect(await readRentalById(rentalId)).toMatchObject({
        totalUsd: 6,
        label: null,
        priceUsd: null,
      });
    }
  );

  test(
    'a new Completo rental uses the repriced catalog',
    documented({
      titulo: 'Un alquiler nuevo de Completo usa el precio actualizado',
      area: AREA,
      intent:
        'Comprobar que repreciar un turno base afecta solo a los alquileres nuevos.',
      steps: [
        'Sube Completo a $9 en el catálogo.',
        'Registra un alquiler de Completo en efectivo.',
      ],
      expects: ['El total es $9 y el snapshot guarda $9, 24 horas y $1.'],
    }),
    async ({ page }) => {
      // Arrange
      await updateShiftInDb('completo', { price_usd: 9 });
      await bootstrapAtDashboard(page);

      // Act
      await createRentalWith(page, 'completo');

      // Assert
      expect(await readLatestRental()).toMatchObject({
        shift: 'completo',
        totalUsd: 9,
        priceUsd: 9,
        hours: 24,
        divisaDiscountUsd: 1,
      });
    }
  );

  test(
    'the shifts metrics show the custom shift by name',
    documented({
      titulo: 'Las métricas muestran el turno nuevo por su nombre',
      area: AREA,
      intent: 'Comprobar que la distribución por turno no muestra ids opacos.',
      steps: [
        'Registra un alquiler de Nocturno.',
        'Abre Lavadoras, Métricas Lavadoras.',
      ],
      expects: ['La distribución por turno incluye «Nocturno» con 1.'],
    }),
    async ({ page }) => {
      // Arrange
      await seedNocturno();
      await bootstrapAtDashboard(page);
      await createRentalWith(page, 'Nocturno');

      // Act
      await page.getByLabel('Abrir submenú del módulo').click();
      await page.getByLabel('Ir a Métricas Lavadoras').click();

      // Assert
      const row = page.locator('div', { hasText: /^Nocturno1$/ }).first();
      await expect(row).toBeVisible();
    }
  );

  test(
    'offline, the cached catalog still offers the custom shift and the snapshot syncs',
    documented({
      titulo:
        'Sin conexión el catálogo guardado sigue ofreciendo el turno nuevo',
      area: AREA,
      intent:
        'Comprobar que un alquiler de un turno nuevo hecho sin internet llega con su snapshot.',
      steps: [
        'Abre la app con conexión para guardar el catálogo.',
        'Corta la conexión y registra un alquiler de Nocturno.',
        'Restablece la conexión y espera la sincronización.',
      ],
      expects: [
        'El alquiler llega a la base con el id de Nocturno.',
        'Guarda Nocturno, 4 horas, $5 y $1 de regla de descuento.',
      ],
    }),
    async ({ page, context }) => {
      // Arrange
      const shiftId = await seedNocturno();
      await bootstrapAtDashboard(page);
      await context.setOffline(true);

      // Act
      await createRentalWith(page, 'Nocturno');
      const rentalsWhileOffline = (await readRentals()).length;
      await context.setOffline(false);

      // Assert
      expect(rentalsWhileOffline).toBe(0);
      await expect
        .poll(async () => (await readRentals()).length, { timeout: 45_000 })
        .toBe(1);
      expect(await readLatestRental()).toMatchObject({
        shift: shiftId,
        label: 'Nocturno',
        hours: 4,
        priceUsd: 5,
        divisaDiscountUsd: 1,
        totalUsd: 5,
      });
    }
  );

  test(
    'if the catalog cannot be read the three base shifts still work',
    documented({
      titulo: 'Si el catálogo falla, los tres turnos base siguen funcionando',
      area: AREA,
      intent:
        'Comprobar el respaldo: sin catálogo se puede registrar un alquiler con los turnos de siempre.',
      steps: [
        'Hace fallar la lectura del catálogo.',
        'Abre el formulario de nuevo alquiler y registra uno de Completo.',
      ],
      expects: [
        'Aparecen Medio Turno, Completo y Doble.',
        'El alquiler se guarda por $6 con el snapshot de Completo.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await page.route('**/rest/v1/rental_shifts*', (route) =>
        route.fulfill({ status: 500, body: '{"message":"boom"}' })
      );
      await bootstrapAtDashboard(page);
      await openRentalsModule(page);

      // Act
      await page.getByTestId('rentals-add-fab').click();
      await expect(page.getByTestId('rental-shift-option-medio')).toBeVisible();
      await expect(page.getByTestId('rental-shift-option-doble')).toBeVisible();
      await page.keyboard.press('Escape');
      await createRentalWith(page, 'completo');

      // Assert
      expect(await readLatestRental()).toMatchObject({
        shift: 'completo',
        totalUsd: 6,
        label: 'Completo',
        priceUsd: 6,
      });
    }
  );
});
