import { waitForSaleByMarker } from '../support/dbPolling';
import { createExpense } from '../support/drivers/expenseDriver';
import { createWasherRental } from '../support/drivers/rentalDriver';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { registerSaleOffline } from '../support/offlineSale';
import { createRunMarker } from '../support/runMarker';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

const AREA = 'Sin conexión';

test.describe('offline sync (legacy processor)', () => {
  test(
    'a rental registered offline reaches the database when the connection returns',
    documented({
      titulo:
        '[B14 corregido] Un alquiler hecho sin conexión llega a la base al volver la conexión',
      area: AREA,
      intent:
        'Comprobar que un alquiler registrado sin internet (cliente ya existente, sin propina) se sincroniza cuando vuelve la conexión.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado para «Cliente Prueba 1».',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El alquiler existe en la base.'],
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        customerName: 'Cliente Prueba 1',
      });

      // Act
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const { count } = await getSupabaseClient()
        .from('washer_rentals')
        .select('id', { count: 'exact', head: true });
      expect(count).toBe(1);
    }
  );

  test(
    'an expense registered offline reaches the database when the connection returns',
    documented({
      titulo:
        '[B14 corregido] Un egreso hecho sin conexión llega a la base al volver la conexión',
      area: AREA,
      intent:
        'Comprobar que un egreso registrado sin internet se sincroniza cuando vuelve la conexión.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un egreso de Bs 30 en efectivo.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El egreso existe en la base.'],
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);
      await createExpense(page, {
        description: 'Egreso offline B14',
        amountBs: 30,
        category: 'otros',
        splits: [{ method: 'efectivo', amountBs: 30 }],
      });

      // Act
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const { count } = await getSupabaseClient()
        .from('expenses')
        .select('id', { count: 'exact', head: true });
      expect(count).toBe(1);
    }
  );

  test(
    'a customer created offline reaches the database when the connection returns',
    documented({
      titulo:
        '[B14 corregido] Un cliente creado sin conexión llega a la base al volver la conexión',
      area: AREA,
      intent:
        'Comprobar que un cliente guardado sin internet se sincroniza cuando vuelve la conexión.',
      steps: [
        'Abre Clientes y corta la conexión.',
        'Crea «Cliente Offline E2E» con teléfono y dirección.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El cliente existe en la base.'],
    }),
    async ({ page, context }) => {
      // Arrange
      await gotoDashboard(page);
      await page.getByLabel('Abrir más opciones').click();
      await page.getByLabel('Ir a Clientes').click();
      await expect(page.getByTestId('customers-add-fab')).toBeVisible();
      await context.setOffline(true);

      // Act
      await page.getByTestId('customers-add-fab').click();
      await page
        .getByPlaceholder('Nombre del cliente')
        .fill('Cliente Offline E2E');
      await page.getByPlaceholder('Número de teléfono').fill('04141112233');
      await page.getByPlaceholder('Dirección').fill('Calle Offline 1');
      await page.getByRole('button', { name: 'Guardar Cliente' }).click();
      await page.waitForTimeout(1_500);
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const { count } = await getSupabaseClient()
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('name', 'Cliente Offline E2E');
      expect(count).toBe(1);
    }
  );

  test(
    'a sale edited offline is updated in the database when the connection returns',
    documented({
      titulo:
        '[B14 corregido] Una venta editada sin conexión se actualiza en la base al volver la conexión',
      area: AREA,
      intent:
        'Comprobar que el cambio de subtotal hecho sin internet sobre una venta ya guardada llega a la base cuando vuelve la conexión.',
      steps: [
        'Registra una venta de Bs 1000 con conexión.',
        'Corta la conexión, abre la edición de la venta, cambia el subtotal a 1500 y guarda.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['La venta queda con total Bs 1500 en la base.'],
    }),
    async ({ page, context }) => {
      // Arrange
      const marker = createRunMarker();
      await bootstrapAtDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 1000,
        splits: [{ method: 'efectivo', amountBs: 1000 }],
        noteMarker: marker.notesValue,
      });
      const sale = await waitForSaleByMarker(marker.notesValue);
      await context.setOffline(true);

      // Act
      await page.getByTestId(`sale-edit-trigger-${sale.id}`).click();
      const sheet = page.getByRole('dialog');
      await expect(sheet.getByText(/Editar Venta/)).toBeVisible();
      await page.waitForTimeout(1_500);
      await sheet.locator('input[type="number"]').first().fill('1500');
      await sheet.getByRole('button', { name: 'Guardar Cambios' }).click();
      await page.waitForTimeout(1_500);
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const { data } = await getSupabaseClient()
        .from('sales')
        .select('total_bs')
        .eq('id', sale.id)
        .single();
      expect(Number(data?.total_bs)).toBe(1500);
    }
  );

  test(
    'a rental for a new customer registered offline reaches the database with its customer',
    documented({
      titulo:
        '[B12 corregido] Un alquiler para un cliente nuevo hecho sin conexión llega a la base con su cliente',
      area: AREA,
      intent:
        'Comprobar que, sin internet, un alquiler para un cliente que todavía no existe se registra y, al volver la conexión, llega a la base ligado a ese cliente.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado escribiendo el nombre de un cliente nuevo.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: [
        'La hoja «Nuevo Alquiler» se cierra.',
        'El cliente nuevo y el alquiler existen en la base, y el alquiler apunta a ese cliente.',
      ],
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);
      const customerName = `Cliente offline ${Date.now()}`;

      // Act (the driver waits for the sheet to close)
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        customerName,
      });
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const supabase = getSupabaseClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customerName)
        .maybeSingle();
      const { data: rentals } = await supabase
        .from('washer_rentals')
        .select('customer_id');
      expect(customer?.id).toBeTruthy();
      expect(rentals?.map((rental) => rental.customer_id)).toEqual([
        customer?.id,
      ]);
    }
  );

  test(
    '[B13 corregido] a rental with a tip registered offline reaches the database with its tip',
    documented({
      titulo:
        '[B13 corregido] Un alquiler con propina hecho sin conexión llega a la base con su propina',
      area: AREA,
      intent:
        'Comprobar que, sin internet, un alquiler con propina (cliente ya existente) se registra y, al volver la conexión, el alquiler y su propina llegan a la base.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado para «Cliente Prueba 1» con propina de Bs 100.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: [
        'La hoja «Nuevo Alquiler» se cierra.',
        'El alquiler existe en la base y tiene una propina de Bs 100 ligada a él.',
      ],
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);

      // Act (the driver waits for the sheet to close)
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        tip: { amountBs: 100, method: 'efectivo', paid: false },
        customerName: 'Cliente Prueba 1',
      });
      await context.setOffline(false);
      await page.waitForTimeout(30_000);

      // Assert
      const supabase = getSupabaseClient();
      const { data: rentals } = await supabase
        .from('washer_rentals')
        .select('id');
      const { data: tips } = await supabase
        .from('tips')
        .select('origin_type,origin_id,amount_bs');
      expect(rentals).toHaveLength(1);
      expect(
        tips?.map((tip) => [
          tip.origin_type,
          tip.origin_id,
          Number(tip.amount_bs),
        ])
      ).toEqual([['rental', rentals?.[0].id, 100]]);
    }
  );

  test(
    '[B11 corregido] a sale with a tip registered offline creates its tip when the connection returns',
    documented({
      titulo:
        '[B11 corregido] Una venta con propina hecha sin conexión crea su propina al volver la conexión',
      area: AREA,
      intent:
        'Comprobar que la propina de una venta registrada sin internet llega a la base (y a Propinas) cuando vuelve la conexión.',
      steps: [
        'Abre el dashboard, corta la conexión y registra una venta de Bs 1000 con propina de Bs 100.',
        'Restablece la conexión y espera la sincronización (la venta llega).',
      ],
      expects: ['Existe una propina cuyo origin_id es el id de la venta real.'],
    }),
    async ({ page, context }) => {
      // Act
      const result = await registerSaleOffline(page, context, {
        globalOrchestrator: false,
        tip: true,
      });

      // Assert
      expect(result.saleId, 'la venta llegó a la base').toBeTruthy();
      expect(result.tipOriginIds).toEqual([result.saleId]);
    }
  );
});
