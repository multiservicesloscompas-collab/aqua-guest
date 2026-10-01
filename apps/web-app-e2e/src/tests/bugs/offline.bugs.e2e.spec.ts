import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { useCleanDomain } from '../../support/bugs/setup';
import { createWasherRental } from '../../support/drivers/rentalDriver';
import { createWaterSale } from '../../support/drivers/waterSaleDriver';
import { createRunMarker } from '../../support/runMarker';
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
