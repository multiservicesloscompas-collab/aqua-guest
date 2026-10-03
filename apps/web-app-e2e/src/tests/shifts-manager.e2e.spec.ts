import { BASELINE_RENTAL_SHIFTS } from '../support/reset/baseline';
import {
  createShiftViaUi,
  fillShiftForm,
  openShiftsPage,
  readAllShifts,
  readShiftById,
} from '../support/drivers/shiftsDriver';
import { documented, expect, test } from '../support/fixtures';
import { getSupabaseClient } from '../support/supabaseClient';

const AREA = 'Turnos de alquiler (gestión)';
const BASE = BASELINE_RENTAL_SHIFTS.length;

async function activeCount(): Promise<number> {
  const shifts = await readAllShifts();
  return shifts.filter((shift) => shift.deleted_at === null).length;
}

test.describe('shifts management screen', () => {
  test(
    'lists the baseline shifts with their code, duration and price',
    documented({
      titulo: 'La pantalla lista los turnos con código, duración y precio',
      area: AREA,
      intent:
        'Comprobar que la pantalla muestra los tres turnos de la línea base con lo que cuesta cada uno.',
      steps: ['Abre Lavadoras, Turnos de Alquiler.'],
      expects: [
        'Aparecen Medio Turno, Completo y Doble con sus códigos MEDIO, COMPLETO y DOBLE.',
        'Completo muestra 1 día, $6.00 y el descuento en divisa de $1.00.',
        'Medio Turno y Doble no muestran descuento.',
      ],
    }),
    async ({ page }) => {
      // Arrange / Act
      await openShiftsPage(page);

      // Assert
      await expect(page.getByTestId('shift-label-medio')).toHaveText(
        'Medio Turno'
      );
      await expect(page.getByTestId('shift-code-medio')).toHaveText('MEDIO');
      await expect(page.getByTestId('shift-duration-medio')).toHaveText(
        '8 horas'
      );
      await expect(page.getByTestId('shift-price-medio')).toHaveText('$4.00');
      await expect(page.getByTestId('shift-code-completo')).toHaveText(
        'COMPLETO'
      );
      await expect(page.getByTestId('shift-duration-completo')).toHaveText(
        '1 día'
      );
      await expect(page.getByTestId('shift-price-completo')).toHaveText(
        '$6.00'
      );
      await expect(page.getByTestId('shift-discount-completo')).toContainText(
        '$1.00'
      );
      await expect(page.getByTestId('shift-duration-doble')).toHaveText(
        '2 días'
      );
      await expect(page.getByTestId('shift-discount-medio')).toHaveCount(0);
      await expect(page.getByTestId('shift-discount-doble')).toHaveCount(0);
    }
  );

  test(
    'create a shift derives its code from the label',
    documented({
      titulo: 'Crear un turno genera su código a partir del nombre',
      area: AREA,
      intent:
        'Comprobar que un turno nuevo se guarda con su precio, horas y un código en mayúsculas.',
      steps: [
        'Abre Turnos de Alquiler y pulsa Nuevo.',
        'Escribe «Turno Nocturno», 12 horas y $5, y guarda.',
      ],
      expects: [
        `La base pasa de ${BASE} a ${BASE + 1} turnos.`,
        'El turno tiene el código TURNO_NOCTURNO, 12 horas y $5.',
        'La tarjeta aparece en la lista con el mismo código.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      const shift = await createShiftViaUi(page, {
        label: 'Turno Nocturno',
        hours: '12',
        price: '5',
      });

      // Assert
      expect(shift).toMatchObject({
        code: 'TURNO_NOCTURNO',
        hours: 12,
        price_usd: 5,
        divisa_discount_usd: 0,
        is_active: true,
        deleted_at: null,
      });
      expect(await activeCount()).toBe(BASE + 1);
      await expect(page.getByTestId(`shift-code-${shift.id}`)).toHaveText(
        'TURNO_NOCTURNO'
      );
      await expect(page.getByTestId(`shift-price-${shift.id}`)).toHaveText(
        '$5.00'
      );
    }
  );

  test(
    'the code preview follows the label while typing',
    documented({
      titulo: 'La vista previa del código sigue al nombre',
      area: AREA,
      intent:
        'Comprobar que el código que se va a guardar se ve antes de guardar, sin tildes ni símbolos.',
      steps: [
        'Abre el formulario de turno nuevo.',
        'Escribe «Medio-Día  Súper!!».',
      ],
      expects: ['La vista previa muestra MEDIO_DIA_SUPER.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.getByTestId('shifts-add-button').click();

      // Act
      await fillShiftForm(page, { label: 'Medio-Día  Súper!!' });

      // Assert
      await expect(page.getByTestId('shift-form-code-preview')).toHaveText(
        'MEDIO_DIA_SUPER'
      );
    }
  );

  test(
    'a label that repeats an existing code gets a numeric suffix',
    documented({
      titulo: 'Un nombre repetido recibe un código con sufijo numérico',
      area: AREA,
      intent:
        'Comprobar que dos turnos nunca comparten código, aunque tengan el mismo nombre.',
      steps: [
        'Crea un turno llamado «Completo!» (su código sería COMPLETO, que ya existe).',
        'Crea otro llamado «Completo?».',
      ],
      expects: [
        'El primero queda con el código COMPLETO_2 y el segundo con COMPLETO_3.',
        'El turno original sigue con el código COMPLETO.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      const first = await createShiftViaUi(page, {
        label: 'Completo!',
        hours: '10',
        price: '3',
      });
      const second = await createShiftViaUi(page, {
        label: 'Completo?',
        hours: '11',
        price: '4',
      });

      // Assert
      expect(first.code).toBe('COMPLETO_2');
      expect(second.code).toBe('COMPLETO_3');
      expect((await readShiftById('completo')).code).toBe('COMPLETO');
    }
  );

  test(
    'create a shift with a divisa discount',
    documented({
      titulo: 'Crear un turno con descuento en divisa',
      area: AREA,
      intent: 'Comprobar que el descuento en divisa se guarda con el turno.',
      steps: [
        'Crea «Express» de 6 horas a $4 con descuento en divisa de $0.50.',
      ],
      expects: [
        'La base guarda un descuento de 0.5.',
        'La tarjeta muestra «Descuento en divisa: $0.50».',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      const shift = await createShiftViaUi(page, {
        label: 'Express',
        hours: '6',
        price: '4',
        discount: '0.5',
      });

      // Assert
      expect(shift.divisa_discount_usd).toBe(0.5);
      await expect(
        page.getByTestId(`shift-discount-${shift.id}`)
      ).toContainText('$0.50');
    }
  );

  test(
    'an empty form shows every validation error and saves nothing',
    documented({
      titulo: 'Un formulario vacío muestra todos los errores y no guarda',
      area: AREA,
      intent: 'Comprobar que no se puede crear un turno sin datos.',
      steps: [
        'Abre el formulario de turno nuevo y pulsa guardar sin escribir.',
      ],
      expects: [
        'Se muestran los errores de nombre, precio y duración.',
        `La base sigue con ${BASE} turnos.`,
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.getByTestId('shifts-add-button').click();

      // Act
      await page.getByTestId('shift-form-submit').click();

      // Assert
      const errors = page.getByTestId('shift-form-errors');
      await expect(errors).toContainText('Escribe el nombre del turno');
      await expect(errors).toContainText('El precio debe ser');
      await expect(errors).toContainText('La duración debe ser');
      expect((await readAllShifts()).length).toBe(BASE);
    }
  );

  const INVALID_CASES = [
    {
      name: 'a discount greater than the price',
      form: { label: 'Malo', hours: '5', price: '3', discount: '4' },
      message: 'El descuento no puede ser mayor que el precio',
    },
    {
      name: 'zero hours',
      form: { label: 'Malo', hours: '0', price: '3' },
      message: 'La duración debe ser',
    },
    {
      name: 'a fractional number of hours',
      form: { label: 'Malo', hours: '2.5', price: '3' },
      message: 'La duración debe ser',
    },
    {
      name: 'a negative price',
      form: { label: 'Malo', hours: '5', price: '-1' },
      message: 'El precio debe ser',
    },
    {
      name: 'a label made only of symbols',
      form: { label: '!!!', hours: '5', price: '3' },
      message: 'El nombre debe incluir letras o números',
    },
  ] as const;

  for (const invalid of INVALID_CASES) {
    test(
      `rejects ${invalid.name}`,
      documented({
        titulo: `Rechaza ${invalid.name}`,
        area: AREA,
        intent: 'Comprobar que un dato inválido se explica y no se guarda.',
        steps: ['Abre el formulario, escribe el dato inválido y guarda.'],
        expects: [
          `Se muestra «${invalid.message}».`,
          `La base sigue con ${BASE} turnos.`,
        ],
      }),
      async ({ page }) => {
        // Arrange
        await openShiftsPage(page);
        await page.getByTestId('shifts-add-button').click();
        await fillShiftForm(page, invalid.form);

        // Act
        await page.getByTestId('shift-form-submit').click();

        // Assert
        await expect(page.getByTestId('shift-form-errors')).toContainText(
          invalid.message
        );
        expect((await readAllShifts()).length).toBe(BASE);
      }
    );
  }

  test(
    'accepts a free shift with no discount',
    documented({
      titulo: 'Acepta un turno gratuito',
      area: AREA,
      intent: 'Comprobar el borde de precio cero.',
      steps: ['Crea «Cortesía» de 2 horas a $0.'],
      expects: ['El turno se guarda con precio 0.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      const shift = await createShiftViaUi(page, {
        label: 'Cortesía',
        hours: '2',
        price: '0',
      });

      // Assert
      expect(shift.price_usd).toBe(0);
      expect(shift.code).toBe('CORTESIA');
    }
  );

  test(
    'edit the price of a shift keeps its code',
    documented({
      titulo: 'Editar el precio de un turno no cambia su código',
      area: AREA,
      intent: 'Comprobar que el código es estable al editar.',
      steps: [
        'Edita Completo: cambia el nombre a «Día completo» y el precio a $8.',
      ],
      expects: [
        'La base guarda el nombre y precio nuevos.',
        'El código sigue siendo COMPLETO y el id no cambia.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.getByTestId('shift-edit-completo').click();

      // Act
      await fillShiftForm(page, { label: 'Día completo', price: '8' });
      await page.getByTestId('shift-form-submit').click();

      // Assert
      await expect
        .poll(async () => (await readShiftById('completo')).price_usd)
        .toBe(8);
      const shift = await readShiftById('completo');
      expect(shift.label).toBe('Día completo');
      expect(shift.code).toBe('COMPLETO');
      await expect(page.getByTestId('shift-label-completo')).toHaveText(
        'Día completo'
      );
    }
  );

  test(
    'the edit form shows the current values and the fixed code',
    documented({
      titulo: 'El formulario de edición muestra los valores actuales',
      area: AREA,
      intent:
        'Comprobar que editar abre el formulario con lo guardado y que el código no es editable.',
      steps: ['Abre la edición de Completo.'],
      expects: [
        'Nombre «Completo», 24 horas, $6 y descuento activado con $1.',
        'La vista previa muestra COMPLETO.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      await page.getByTestId('shift-edit-completo').click();

      // Assert
      await expect(page.getByTestId('shift-form-label')).toHaveValue(
        'Completo'
      );
      await expect(page.getByTestId('shift-form-hours')).toHaveValue('24');
      await expect(page.getByTestId('shift-form-price')).toHaveValue('6');
      await expect(page.getByTestId('shift-form-discount')).toHaveValue('1');
      await expect(page.getByTestId('shift-form-code-preview')).toHaveText(
        'COMPLETO'
      );
    }
  );

  test(
    'switching the discount off while editing resets it to zero',
    documented({
      titulo: 'Apagar el descuento al editar lo deja en cero',
      area: AREA,
      intent: 'Comprobar que quitar el descuento lo guarda como 0.',
      steps: ['Edita Completo, apaga el descuento en divisa y guarda.'],
      expects: ['La base guarda 0 de descuento y la tarjeta no lo muestra.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.getByTestId('shift-edit-completo').click();

      // Act
      await page.getByTestId('shift-form-discount-toggle').click();
      await page.getByTestId('shift-form-submit').click();

      // Assert
      await expect
        .poll(async () => (await readShiftById('completo')).divisa_discount_usd)
        .toBe(0);
      await expect(page.getByTestId('shift-discount-completo')).toHaveCount(0);
    }
  );

  test(
    'delete a shift is a soft delete',
    documented({
      titulo: 'Eliminar un turno lo marca como borrado, no lo quita de la base',
      area: AREA,
      intent:
        'Comprobar que eliminar conserva la fila para el historial y la oculta de la lista.',
      steps: ['Elimina el turno Doble y confirma.'],
      expects: [
        'La tarjeta desaparece de la lista.',
        'La fila sigue en la base con la fecha de borrado y sin estar activa.',
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      await page.getByTestId('shift-delete-doble').click();
      await page.getByTestId('confirm-delete-confirm').click();

      // Assert
      await expect(page.getByTestId('shift-card-doble')).toHaveCount(0);
      await expect
        .poll(async () => (await readShiftById('doble')).deleted_at)
        .not.toBeNull();
      expect((await readShiftById('doble')).is_active).toBe(false);
      expect((await readAllShifts()).length).toBe(BASE);
    }
  );

  test(
    'cancelling the deletion keeps the shift',
    documented({
      titulo: 'Cancelar el borrado conserva el turno',
      area: AREA,
      intent: 'Comprobar que cancelar no cambia nada.',
      steps: ['Pulsa eliminar en Doble y cancela.'],
      expects: ['El turno sigue en la lista y sin fecha de borrado.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.getByTestId('shift-delete-doble').click();

      // Act
      await page.getByTestId('confirm-delete-cancel').click();

      // Assert
      await expect(page.getByTestId('shift-card-doble')).toBeVisible();
      expect((await readShiftById('doble')).deleted_at).toBeNull();
    }
  );

  test(
    'the last remaining shift cannot be deleted',
    documented({
      titulo: 'No se puede eliminar el último turno',
      area: AREA,
      intent:
        'Comprobar que siempre queda al menos un turno para registrar alquileres.',
      steps: ['Elimina Doble y Medio Turno.', 'Mira el botón de Completo.'],
      expects: ['El botón de eliminar de Completo está deshabilitado.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      for (const id of ['doble', 'medio']) {
        await page.getByTestId(`shift-delete-${id}`).click();
        await page.getByTestId('confirm-delete-confirm').click();
        await expect(page.getByTestId(`shift-card-${id}`)).toHaveCount(0);
      }

      // Act / Assert
      await expect(page.getByTestId('shift-delete-completo')).toBeDisabled();
      await expect(page.getByTestId('shift-edit-completo')).toBeEnabled();
    }
  );

  test(
    'created shifts are still there after reloading',
    documented({
      titulo: 'Los turnos creados siguen ahí después de recargar',
      area: AREA,
      intent:
        'Comprobar que el catálogo viene de la base y no solo de memoria.',
      steps: ['Crea «Persistente».', 'Recarga la app y vuelve a la pantalla.'],
      expects: ['La tarjeta del turno sigue en la lista.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      const shift = await createShiftViaUi(page, {
        label: 'Persistente',
        hours: '3',
        price: '2',
      });

      // Act
      await openShiftsPage(page);

      // Assert
      await expect(page.getByTestId(`shift-card-${shift.id}`)).toBeVisible();
    }
  );

  test(
    'a shift deleted elsewhere disappears after reloading',
    documented({
      titulo: 'Un turno borrado desde otro dispositivo desaparece al recargar',
      area: AREA,
      intent: 'Comprobar que la lista se actualiza con lo que hay en la base.',
      steps: [
        'Crea «Efímero» desde la app.',
        'Lo marca como borrado directamente en la base.',
        'Recarga la app.',
      ],
      expects: ['La tarjeta ya no aparece.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      const shift = await createShiftViaUi(page, {
        label: 'Efímero',
        hours: '3',
        price: '2',
      });
      await getSupabaseClient()
        .from('rental_shifts')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', shift.id);

      // Act
      await openShiftsPage(page);

      // Assert
      await expect(page.getByTestId(`shift-card-${shift.id}`)).toHaveCount(0);
      await expect(page.getByTestId('shift-card-completo')).toBeVisible();
    }
  );

  test(
    'offline blocks the management and explains why',
    documented({
      titulo: 'Sin conexión la gestión se bloquea y se explica por qué',
      area: AREA,
      intent:
        'Comprobar que sin internet no se puede crear, editar ni eliminar turnos.',
      steps: ['Abre la pantalla.', 'Corta la conexión.'],
      expects: [
        'Aparece el aviso de falta de conexión.',
        'Nuevo, editar y eliminar quedan deshabilitados.',
        'Al volver la conexión se habilitan y el aviso desaparece.',
      ],
    }),
    async ({ page, context }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      await context.setOffline(true);

      // Assert
      await expect(page.getByTestId('shifts-offline-notice')).toBeVisible();
      await expect(page.getByTestId('shifts-add-button')).toBeDisabled();
      await expect(page.getByTestId('shift-edit-completo')).toBeDisabled();
      await expect(page.getByTestId('shift-delete-completo')).toBeDisabled();

      await context.setOffline(false);
      await expect(page.getByTestId('shifts-offline-notice')).toHaveCount(0);
      await expect(page.getByTestId('shifts-add-button')).toBeEnabled();
    }
  );

  test(
    'a failed save keeps the form open and the database unchanged',
    documented({
      titulo: 'Un guardado fallido deja el formulario abierto',
      area: AREA,
      intent:
        'Comprobar que si la base rechaza el turno el usuario no pierde lo escrito.',
      steps: [
        'Intercepta la creación y la hace fallar.',
        'Rellena un turno válido y guarda.',
      ],
      expects: [
        'El formulario sigue abierto con los datos.',
        `La base sigue con ${BASE} turnos.`,
      ],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);
      await page.route('**/rest/v1/rental_shifts*', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 500, body: '{"message":"boom"}' });
          return;
        }
        await route.continue();
      });
      await page.getByTestId('shifts-add-button').click();
      await fillShiftForm(page, { label: 'Fallido', hours: '4', price: '2' });

      // Act
      await page.getByTestId('shift-form-submit').click();

      // Assert
      await expect(page.getByTestId('shift-form-label')).toHaveValue('Fallido');
      await expect(page.getByTestId('shift-form-submit')).toBeEnabled();
      expect((await readAllShifts()).length).toBe(BASE);
      await expect(page.getByText('Error guardando el turno')).toBeVisible();
    }
  );

  test(
    'a label with surrounding spaces is stored trimmed',
    documented({
      titulo: 'Un nombre con espacios extremos se guarda recortado',
      area: AREA,
      intent: 'Comprobar que el nombre no guarda espacios sobrantes.',
      steps: ['Crea un turno llamado «  Tarde  ».'],
      expects: ['La base guarda «Tarde» y el código TARDE.'],
    }),
    async ({ page }) => {
      // Arrange
      await openShiftsPage(page);

      // Act
      const shift = await createShiftViaUi(page, {
        label: '  Tarde  ',
        hours: '5',
        price: '2',
      });

      // Assert
      expect(shift.label).toBe('Tarde');
      expect(shift.code).toBe('TARDE');
    }
  );
});
