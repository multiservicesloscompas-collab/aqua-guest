import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { useCleanDomain } from '../../support/bugs/setup';
import { createExpense } from '../../support/drivers/expenseDriver';
import { createWasherRental } from '../../support/drivers/rentalDriver';
import { createWaterSale } from '../../support/drivers/waterSaleDriver';
import { waitForSaleByMarker } from '../../support/dbPolling';
import { createRunMarker } from '../../support/runMarker';
import { gotoDashboard } from '../../support/uiNavigation';
import {
  findLatestSaleByMarker,
  getSupabaseClient,
  listSaleSplitsBySaleIds,
} from '../../support/supabaseClient';
import { bootstrapAtDashboard } from '../../support/waterSalesTipsMatrix/uiHelpers';

useCleanDomain();

async function registerSaleOffline(
  page: Page,
  context: BrowserContext,
  options: { globalOrchestrator: boolean; tip: boolean }
): Promise<{ saleId?: string; splitCount: number; tipOriginIds: string[] }> {
  if (options.globalOrchestrator) {
    await context.addInitScript(
      "window.localStorage.setItem('offline.flag.global_orchestrator', 'true')"
    );
  }
  const marker = createRunMarker();
  await bootstrapAtDashboard(page);
  await context.setOffline(true);
  await createWaterSale(
    page,
    {
      basePriceBs: 1000,
      splits: [{ method: 'efectivo', amountBs: 1000 }],
      tip: options.tip
        ? { amountBs: 100, method: 'efectivo', paid: false }
        : undefined,
      noteMarker: marker.notesValue,
    },
    { waitForToast: false }
  );
  await page.waitForTimeout(1_000);
  await context.setOffline(false);
  await expect
    .poll(async () => (await findLatestSaleByMarker(marker.notesValue))?.id, {
      timeout: 40_000,
    })
    .toBeTruthy();
  await page.waitForTimeout(15_000);
  const sale = await findLatestSaleByMarker(marker.notesValue);
  const splits = sale ? await listSaleSplitsBySaleIds([sale.id]) : [];
  const { data: tips } = await getSupabaseClient()
    .from('tips')
    .select('origin_id');
  return {
    saleId: sale?.id,
    splitCount: splits.length,
    tipOriginIds: (tips ?? []).map((tip) => tip.origin_id as string),
  };
}

test.describe('Sin conexión (rojos)', () => {
  test(
    '[B11] a sale with a tip registered offline creates its tip when the connection returns',
    bugDoc({
      id: 'B11',
      titulo:
        'Una venta con propina hecha sin conexión crea su propina al volver la conexión',
      intent:
        'Comprobar que la propina de una venta registrada sin internet llega a la base (y a Propinas) cuando vuelve la conexión.',
      steps: [
        'Abre el dashboard, corta la conexión y registra una venta de Bs 1000 con propina de Bs 100.',
        'Restablece la conexión y espera la sincronización (la venta llega).',
      ],
      expects: ['Existe una propina cuyo origin_id es el id de la venta real.'],
      actual:
        'la rama sin conexión solo encola la venta y sus pagos (que ya incluyen la propina); la propina nunca se encola, así que la venta queda con el dinero de la propina y sin propina que pagar',
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

  test(
    '[B12] a rental for a new customer can be registered offline',
    bugDoc({
      id: 'B12',
      titulo:
        'Se puede registrar sin conexión un alquiler para un cliente nuevo',
      intent:
        'Comprobar que, sin internet, un alquiler para un cliente que todavía no existe se registra y la hoja se cierra con el aviso de éxito.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado escribiendo el nombre de un cliente nuevo.',
      ],
      expects: [
        'La hoja «Nuevo Alquiler» se cierra y el alquiler queda registrado.',
      ],
      actual:
        'el formulario intenta crear el cliente en el servidor antes de mirar si hay conexión, falla y el usuario ve «Error al registrar el alquiler» con la hoja abierta: el alquiler no se guarda',
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);

      // Act + Assert (the driver waits for the sheet to close)
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        customerName: `Cliente B12 ${Date.now()}`,
      });
    }
  );

  test(
    '[B13] a rental with a tip can be registered offline',
    bugDoc({
      id: 'B13',
      titulo: 'Se puede registrar sin conexión un alquiler con propina',
      intent:
        'Comprobar que, sin internet, un alquiler con propina (cliente ya existente) se registra y la hoja se cierra con el aviso de éxito.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado para «Cliente Prueba 1» con propina de Bs 100.',
      ],
      expects: [
        'La hoja «Nuevo Alquiler» se cierra y el alquiler queda registrado.',
      ],
      actual:
        'el alquiler se encola sin conexión, pero después se intenta crear la propina directo en el servidor, falla, y el usuario ve «Error al registrar el alquiler» con la hoja abierta y sin propina',
    }),
    async ({ page, context }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await context.setOffline(true);

      // Act + Assert (the driver waits for the sheet to close)
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        tip: { amountBs: 100, method: 'efectivo', paid: false },
        customerName: 'Cliente Prueba 1',
      });
    }
  );

  test(
    '[B14] a rental registered offline reaches the database when the connection returns',
    bugDoc({
      id: 'B14',
      titulo:
        'Un alquiler hecho sin conexión llega a la base al volver la conexión',
      intent:
        'Comprobar que un alquiler registrado sin internet (cliente ya existente, sin propina) se sincroniza cuando vuelve la conexión.',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un alquiler pagado para «Cliente Prueba 1».',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El alquiler existe en la base.'],
      actual:
        'el procesador de la cola que corre por defecto solo reproduce INSERT de ventas; el alquiler y sus pagos se quedan «en cola» para siempre y no se hace ninguna escritura',
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
    '[B14] an expense registered offline reaches the database when the connection returns',
    bugDoc({
      id: 'B14',
      titulo:
        'Un egreso hecho sin conexión llega a la base al volver la conexión',
      intent:
        'Comprobar que un egreso registrado sin internet se sincroniza cuando vuelve la conexión (misma causa que el alquiler).',
      steps: [
        'Abre el dashboard y corta la conexión.',
        'Registra un egreso de Bs 30 en efectivo.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El egreso existe en la base.'],
      actual:
        'el procesador de la cola que corre por defecto solo reproduce INSERT de ventas; el egreso se queda «en cola» para siempre',
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
    '[B14] a customer created offline reaches the database when the connection returns',
    bugDoc({
      id: 'B14',
      titulo:
        'Un cliente creado sin conexión llega a la base al volver la conexión',
      intent:
        'Comprobar que un cliente guardado sin internet se sincroniza cuando vuelve la conexión (misma causa que el alquiler).',
      steps: [
        'Abre Clientes y corta la conexión.',
        'Crea «Cliente Offline E2E» con teléfono y dirección.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['El cliente existe en la base.'],
      actual:
        'el procesador de la cola que corre por defecto solo reproduce INSERT de ventas; el cliente se queda «en cola» para siempre',
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
    '[B14] a sale edited offline is updated in the database when the connection returns',
    bugDoc({
      id: 'B14',
      titulo:
        'Una venta editada sin conexión se actualiza en la base al volver la conexión',
      intent:
        'Comprobar que el cambio de subtotal hecho sin internet sobre una venta ya guardada llega a la base cuando vuelve la conexión.',
      steps: [
        'Registra una venta de Bs 1000 con conexión.',
        'Corta la conexión, abre la edición de la venta, cambia el subtotal a 1500 y guarda.',
        'Restablece la conexión y espera 30 segundos.',
      ],
      expects: ['La venta queda con total Bs 1500 en la base.'],
      actual:
        'el procesador de la cola que corre por defecto ignora los UPDATE; el cambio se queda «en cola» y la base conserva Bs 1000',
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
    '[C1-control] with the legacy processor, a sale registered offline syncs with its payments',
    bugDoc({
      id: 'C1',
      control: true,
      titulo:
        'Con el procesador actual, una venta sin propina hecha sin conexión llega con sus pagos',
      intent:
        'Fijar que hoy (bandera apagada) la venta hecha sin conexión llega con su reparto de pagos, para acotar C1 al orquestador global.',
      steps: [
        'Abre el dashboard, corta la conexión y registra una venta de Bs 1000 sin propina.',
        'Restablece la conexión y espera la sincronización.',
      ],
      expects: ['La venta existe y tiene al menos un pago guardado.'],
      actual: 'no aplica',
    }),
    async ({ page, context }) => {
      // Act
      const result = await registerSaleOffline(page, context, {
        globalOrchestrator: false,
        tip: false,
      });

      // Assert
      expect(result.saleId, 'la venta llegó a la base').toBeTruthy();
      expect(result.splitCount).toBeGreaterThan(0);
    }
  );

  test(
    '[C1] with the global orchestrator on, a sale registered offline syncs with its payments',
    bugDoc({
      id: 'C1',
      titulo:
        'Con el orquestador global activo, una venta hecha sin conexión llega con sus pagos',
      intent:
        'Comprobar que, con la bandera del orquestador global encendida (hoy apagada por defecto), la venta hecha sin conexión llega con su reparto de pagos.',
      steps: [
        'Enciende la bandera offline.flag.global_orchestrator y abre el dashboard.',
        'Corta la conexión y registra una venta de Bs 1000 sin propina.',
        'Restablece la conexión y espera la sincronización.',
      ],
      expects: ['La venta existe y tiene al menos un pago guardado.'],
      actual:
        'el orquestador solo resuelve dependencias por id de acción y las claves de negocio temporales nunca se resuelven, así que los pagos quedan esperando',
    }),
    async ({ page, context }) => {
      // Act
      const result = await registerSaleOffline(page, context, {
        globalOrchestrator: true,
        tip: false,
      });

      // Assert
      expect(result.saleId, 'la venta llegó a la base').toBeTruthy();
      expect(result.splitCount).toBeGreaterThan(0);
    }
  );
});
