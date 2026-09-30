import { expect, test } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { seedPendingTip, seedSales } from '../../support/bugs/dbSeed';
import { todayVe } from '../../support/bugs/dates';
import { bug, useCleanDomain } from '../../support/bugs/setup';
import {
  createWasherRental,
  deleteRental,
} from '../../support/drivers/rentalDriver';
import { createWaterSale } from '../../support/drivers/waterSaleDriver';
import { openTipsModule } from '../../support/drivers/expenseDriver';
import { waitForSaleByMarker } from '../../support/dbPolling';
import { getSupabaseClient } from '../../support/supabaseClient';
import { listSaleSplitsBySaleIds } from '../../support/supabaseClient';
import { bootstrapAtDashboard } from '../../support/waterSalesTipsMatrix/uiHelpers';
import { createRunMarker } from '../../support/runMarker';

useCleanDomain();

test.describe('Propinas (rojos)', () => {
  test(
    '[B3] editing a sale with a tip and saving unchanged keeps its splits',
    bugDoc({
      id: 'B3',
      titulo:
        'Editar y guardar sin cambios una venta con propina no mueve los métodos',
      intent:
        'Comprobar que abrir la edición de una venta con propina en otro método y guardar sin tocar nada deja intactos sus pagos.',
      steps: [
        'Registra una venta de Bs 1000 pagada en efectivo con propina de Bs 200 capturada en pago móvil.',
        'Lee cómo quedó repartido el pago en la base.',
        'Abre la edición de la venta y pulsa «Guardar Cambios» sin cambiar nada.',
        'Vuelve a leer el reparto.',
      ],
      expects: [
        'Antes y después el reparto es el mismo: efectivo 1000 y pago móvil 200.',
      ],
      actual:
        'el formulario toma la propina (200 en pago móvil) como pago secundario y el guardado la suma otra vez, dejando efectivo 800 y pago móvil 400',
    }),
    async ({ page }) => {
      bug(
        'B3',
        'paymentSplitFormHydration.ts:35-70 · useEditSaleSheetViewModel.ts'
      );
      // Arrange
      const marker = createRunMarker();
      await bootstrapAtDashboard(page);
      await createWaterSale(page, {
        basePriceBs: 1000,
        splits: [{ method: 'efectivo', amountBs: 1000 }],
        tip: { amountBs: 200, method: 'pago_movil', paid: false },
        noteMarker: marker.notesValue,
      });
      const sale = await waitForSaleByMarker(marker.notesValue);
      const snapshot = async () =>
        (await listSaleSplitsBySaleIds([sale.id]))
          .map(({ paymentMethod, amountBs }) => ({ paymentMethod, amountBs }))
          .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
      const before = await snapshot();

      // Act
      await page.getByTestId(`sale-edit-trigger-${sale.id}`).click();
      const sheet = page.getByRole('dialog');
      await expect(sheet.getByText(/Editar Venta/)).toBeVisible();
      await page.waitForTimeout(1_500); // let the tip hydrate into the form
      await sheet.getByRole('button', { name: 'Guardar Cambios' }).click();
      await expect(sheet).toBeHidden({ timeout: 15_000 });

      // Assert
      expect(before).toEqual([
        { paymentMethod: 'efectivo', amountBs: 1000 },
        { paymentMethod: 'pago_movil', amountBs: 200 },
      ]);
      await expect.poll(snapshot, { timeout: 5_000 }).toEqual(before);
    }
  );

  test(
    '[B1] a tip deleted elsewhere disappears from the Tips page',
    bugDoc({
      id: 'B1',
      titulo: 'Una propina borrada deja de aparecer en Propinas',
      intent:
        'Comprobar que la pantalla de Propinas no sigue mostrando una propina que ya no existe en la base.',
      steps: [
        'Siembra una venta con una propina pendiente y abre Propinas (la propina aparece).',
        'Borra la propina directamente en la base.',
        'Sale de Propinas, vuelve a entrar y espera la recarga.',
      ],
      expects: ['La propina ya no aparece en la lista.'],
      actual:
        'la tienda de propinas mezcla lo nuevo con lo que ya tenía y nunca descarta las propinas borradas',
    }),
    async ({ page }) => {
      bug(
        'B1',
        'useTipStore.ts loadTipsByDateRange (Map merge without removal)'
      );
      // Arrange
      const [saleId] = await seedSales([
        { date: todayVe(), dailyNumber: 1, totalBs: 1000 },
      ]);
      const tipId = await seedPendingTip({
        originId: saleId,
        originType: 'sale',
        tipDate: todayVe(),
        amountBs: 100,
      });
      await bootstrapAtDashboard(page);
      await openTipsModule(page);
      await expect(page.getByTestId(`tip-pay-button-${tipId}`)).toBeVisible();

      // Act
      await getSupabaseClient().from('tips').delete().eq('id', tipId);
      await page.getByLabel('Ir a Inicio').click();
      await openTipsModule(page);
      await page.waitForTimeout(2_000);

      // Assert
      await expect(page.getByTestId(`tip-pay-button-${tipId}`)).toHaveCount(0);
    }
  );

  test(
    '[B6] a rental deleted while offline takes its tip off the Tips page',
    bugDoc({
      id: 'B6',
      titulo: 'Borrar un alquiler sin conexión quita su propina de Propinas',
      intent:
        'Comprobar que, al eliminar sin internet un alquiler con propina, la propina deja de mostrarse igual que cuando hay conexión.',
      steps: [
        'Registra un alquiler pagado con propina de Bs 100 y abre Propinas (la propina aparece).',
        'Corta la conexión y elimina el alquiler.',
        'Vuelve a abrir Propinas todavía sin conexión.',
      ],
      expects: ['La propina del alquiler eliminado ya no aparece.'],
      actual:
        'la rama sin conexión encola el borrado de la propina pero no la quita de la tienda en memoria',
    }),
    async ({ page, context }) => {
      bug(
        'B6',
        'useRentalStore.actions.ts:164-187 (offline branch skips removeTipByOrigin)'
      );
      // Arrange
      await bootstrapAtDashboard(page);
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        tip: { amountBs: 100, method: 'efectivo', paid: false },
        customerName: `Cliente B6 ${Date.now()}`,
      });
      const { data } = await getSupabaseClient()
        .from('tips')
        .select('id,origin_id')
        .eq('origin_type', 'rental')
        .single();
      await openTipsModule(page);
      await expect(page.getByTestId(`tip-card-${data?.id}`)).toBeVisible();

      // Act
      await context.setOffline(true);
      await deleteRental(page, data?.origin_id as string);
      await openTipsModule(page);

      // Assert
      await expect(page.getByTestId(`tip-card-${data?.id}`)).toHaveCount(0);
    }
  );
});
