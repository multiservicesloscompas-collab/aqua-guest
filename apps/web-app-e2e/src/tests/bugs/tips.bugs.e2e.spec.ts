import { expect, test } from '@playwright/test';
import { bugDoc } from '../../support/bugs/ficha';
import { seedPendingTip, seedSales } from '../../support/bugs/dbSeed';
import { todayVe } from '../../support/bugs/dates';
import { useCleanDomain } from '../../support/bugs/setup';
import { createWasherRental } from '../../support/drivers/rentalDriver';
import { openTipsModule } from '../../support/drivers/expenseDriver';
import { getSupabaseClient } from '../../support/supabaseClient';
import { bootstrapAtDashboard } from '../../support/waterSalesTipsMatrix/uiHelpers';

useCleanDomain();

test.describe('Propinas (rojos)', () => {
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
    '[B3b] editing a rental with a tip and saving unchanged keeps its splits',
    bugDoc({
      id: 'B3b',
      titulo:
        'Editar y guardar sin cambios un alquiler con propina no mueve los métodos',
      intent:
        'Comprobar que abrir la edición de un alquiler con propina en otro método y guardar sin tocar nada deja intactos sus pagos.',
      steps: [
        'Registra un alquiler pagado en efectivo con propina de Bs 200 capturada en pago móvil.',
        'Lee cómo quedó repartido el pago en la base.',
        'Abre la edición del alquiler y pulsa guardar sin cambiar nada.',
        'Vuelve a leer el reparto.',
      ],
      expects: ['Antes y después el reparto de pagos es el mismo.'],
      actual:
        'el formulario toma la propina como pago secundario y el guardado la suma otra vez, moviendo dinero entre efectivo y pago móvil',
    }),
    async ({ page }) => {
      // Arrange
      await bootstrapAtDashboard(page);
      await createWasherRental(page, {
        shift: 'medio',
        totalUsd: 0,
        isPaid: true,
        splits: [{ method: 'efectivo', amountBs: 0 }],
        tip: { amountBs: 200, method: 'pago_movil', paid: false },
        customerName: `Cliente B3b ${Date.now()}`,
      });
      const { data: tip } = await getSupabaseClient()
        .from('tips')
        .select('origin_id')
        .eq('origin_type', 'rental')
        .single();
      const rentalId = tip?.origin_id as string;
      const snapshot = async () => {
        const { data } = await getSupabaseClient()
          .from('rental_payment_splits')
          .select('payment_method,amount_bs')
          .eq('rental_id', rentalId);
        return (data ?? [])
          .map((row) => ({
            paymentMethod: row.payment_method as string,
            amountBs: Number(row.amount_bs),
          }))
          .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
      };
      const before = await snapshot();

      // Act
      await page.getByTestId(`rental-edit-${rentalId}`).click();
      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();
      await page.waitForTimeout(1_500); // let the tip hydrate into the form
      await sheet.getByTestId('rental-confirm-button').click();
      await expect(sheet).toBeHidden({ timeout: 15_000 });

      // Assert
      expect(before.map((row) => row.paymentMethod)).toEqual([
        'efectivo',
        'pago_movil',
      ]);
      expect(before.find((row) => row.paymentMethod === 'pago_movil')).toEqual({
        paymentMethod: 'pago_movil',
        amountBs: 200,
      });
      await expect.poll(snapshot, { timeout: 5_000 }).toEqual(before);
    }
  );
});
