import { captureDashboardSnapshot } from '../support/drivers/dashboardDriver';
import { openTipsModule } from '../support/drivers/expenseDriver';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { parseUniversalMoney } from '../support/money';
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
