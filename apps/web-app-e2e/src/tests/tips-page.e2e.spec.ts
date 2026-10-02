import { todayVe } from '../support/bugs/dates';
import { seedPendingTip, seedSales } from '../support/bugs/dbSeed';
import { captureDashboardSnapshot } from '../support/drivers/dashboardDriver';
import { openTipsModule } from '../support/drivers/expenseDriver';
import {
  createWasherRental,
  deleteRental,
} from '../support/drivers/rentalDriver';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { parseUniversalMoney } from '../support/money';
import { getSupabaseClient } from '../support/supabaseClient';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

test(
  'pay all pending tips of the day',
  documented({
    titulo: 'Pagar todas las propinas del día de una vez',
    area: 'Propinas',
    intent:
      'Comprobar el resumen de Propinas y el botón «Pagar Todas del Día»: cada propina pasa a pagada y el dinero sale del método elegido.',
    steps: [
      'Registra 3 ventas de Bs 1000 en efectivo con propinas de Bs 100, 200 y 300 capturadas en pago móvil.',
      'Abre Propinas y lee el resumen.',
      'Pulsa «Pagar Todas del Día», elige Efectivo y confirma.',
      'Vuelve al dashboard.',
    ],
    expects: [
      'Antes de pagar: 3 propinas, 3 pendientes, 0 pagadas y un total de Bs 600.',
      'Después de pagar: 0 pendientes y 3 pagadas.',
      'El dashboard muestra egresos de Bs 600 y 6 transacciones (3 ventas y 3 pagos de propina).',
      'Las tarjetas quedan en Efectivo 2400 (3000 − 600) y Pago Móvil 600.',
    ],
    data: 'Ventas de Bs 1000; propinas 100 + 200 + 300 = 600.',
  }),
  async ({ page }) => {
    // Arrange
    await bootstrapAtDashboard(page);
    for (const tip of [100, 200, 300]) {
      await createWaterSale(page, {
        basePriceBs: 1000,
        splits: [{ method: 'efectivo', amountBs: 1000 }],
        tip: { amountBs: tip, method: 'pago_movil', paid: false },
        noteMarker: `E2E_TIPS_PAGE_${tip}_${Date.now()}`,
      });
    }

    // Act
    await openTipsModule(page);
    const count = (id: string) => page.getByTestId(id).innerText();
    const before = {
      total: await count('tips-summary-total-count'),
      pending: await count('tips-summary-pending-count'),
      paid: await count('tips-summary-paid-count'),
      bs: parseUniversalMoney(await count('tips-summary-total-bs')),
    };
    await page.getByRole('button', { name: /Pagar Todas del D/i }).click();
    await page.getByTestId('tip-payment-method-efectivo').click();
    await page.getByRole('button', { name: 'Confirmar Pago' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });

    // Assert
    expect(before).toEqual({ total: '3', pending: '3', paid: '0', bs: 600 });
    await expect(page.getByTestId('tips-summary-pending-count')).toHaveText(
      '0'
    );
    await expect(page.getByTestId('tips-summary-paid-count')).toHaveText('3');
    await page.getByLabel('Ir a Inicio').click();
    const dashboard = await captureDashboardSnapshot(page);
    expect(dashboard.dayExpensesBs).toBe(600);
    expect(dashboard.transactionsCount).toBe(6);
    expect(dashboard.methodTotals.efectivo).toBe(2400);
    expect(dashboard.methodTotals.pago_movil).toBe(600);
  }
);

test(
  'a rental deleted while offline takes its tip off the Tips page',
  documented({
    titulo:
      '[B6 corregido] Borrar un alquiler sin conexión quita su propina de Propinas',
    area: 'Propinas',
    intent:
      'Comprobar que, al eliminar sin internet un alquiler con propina, la propina deja de mostrarse igual que cuando hay conexión.',
    steps: [
      'Registra un alquiler pagado con propina de Bs 100 y abre Propinas (la propina aparece).',
      'Corta la conexión y elimina el alquiler.',
      'Vuelve a abrir Propinas todavía sin conexión.',
      'Restablece la conexión y espera a que se sincronice.',
    ],
    expects: [
      'Sin conexión, la propina del alquiler eliminado ya no aparece.',
      'Al volver la conexión, el alquiler, sus pagos y su propina ya no existen en la base.',
    ],
    data: 'Alquiler medio turno pagado en efectivo; propina de Bs 100.',
  }),
  async ({ page, context }) => {
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

    // Act (reconnect)
    await context.setOffline(false);

    // Assert (database)
    const rentalId = data?.origin_id as string;
    const countRows = async (table: string, column: string) => {
      const { count } = await getSupabaseClient()
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(column, rentalId);
      return count;
    };
    await expect
      .poll(
        async () => ({
          rentals: await countRows('washer_rentals', 'id'),
          splits: await countRows('rental_payment_splits', 'rental_id'),
          tips: await countRows('tips', 'origin_id'),
        }),
        { timeout: 30_000, intervals: [1_000, 2_000] }
      )
      .toEqual({ rentals: 0, splits: 0, tips: 0 });
  }
);

test(
  'a tip deleted elsewhere disappears from the Tips page',
  documented({
    titulo: '[B1 corregido] Una propina borrada deja de aparecer en Propinas',
    area: 'Propinas',
    intent:
      'Comprobar que la pantalla de Propinas no sigue mostrando una propina que ya no existe en la base.',
    steps: [
      'Siembra una venta con una propina pendiente y abre Propinas (la propina aparece).',
      'Borra la propina directamente en la base.',
      'Sale de Propinas, vuelve a entrar y espera la recarga.',
    ],
    expects: ['La propina ya no aparece en la lista.'],
    data: 'Venta de Bs 1000 con una propina pendiente de Bs 100.',
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
