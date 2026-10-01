import {
  balanceAmount,
  createBalanceTransfer,
  openPaymentBalancePage,
} from '../support/drivers/balanceDriver';
import { captureDashboardSnapshot } from '../support/drivers/dashboardDriver';
import { createExpense } from '../support/drivers/expenseDriver';
import { createWaterSale } from '../support/drivers/waterSaleDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';

test(
  'the Equilibrio final total subtracts expenses like the dashboard',
  documented({
    titulo:
      '[FIN-05 corregido] El total final de Equilibrio descuenta egresos como el dashboard',
    area: 'Equilibrio',
    intent:
      'Comprobar que Equilibrio y la tarjeta de Efectivo del dashboard dan el mismo saldo.',
    steps: [
      'Registra una venta de Bs 100 en efectivo y un egreso de Bs 30 en efectivo.',
      'Lee la tarjeta de Efectivo del dashboard y el total final de Equilibrio.',
    ],
    expects: ['Equilibrio muestra Bs 70, igual que la tarjeta de Efectivo.'],
    data: 'Venta de Bs 100 en efectivo; egreso de Bs 30 en efectivo.',
  }),
  async ({ page }) => {
    // Arrange
    await gotoDashboard(page);
    await createWaterSale(page, {
      basePriceBs: 100,
      splits: [{ method: 'efectivo', amountBs: 100 }],
      noteMarker: 'E2E-FIN05',
    });
    await createExpense(page, {
      description: 'E2E gasto',
      amountBs: 30,
      category: 'otros',
      splits: [{ method: 'efectivo', amountBs: 30 }],
    });
    const snapshot = await captureDashboardSnapshot(page);

    // Act
    await openPaymentBalancePage(page);
    const balanceFinal = await balanceAmount(page, 'Efectivo', 'final');

    // Assert
    expect(snapshot.methodTotals.efectivo).toBeCloseTo(70, 1);
    expect(balanceFinal).toBeCloseTo(snapshot.methodTotals.efectivo, 1);
  }
);

test(
  'the Equilibrio summary updates after registering a transfer',
  documented({
    titulo:
      '[FIN-03 corregido] El resumen de Equilibrio se actualiza tras una transferencia',
    area: 'Equilibrio',
    intent:
      'Comprobar que el total final de Efectivo en Equilibrio baja apenas se registra una transferencia.',
    steps: [
      'Registra una venta de Bs 100 en efectivo.',
      'Abre Equilibrio y lee el total final de Efectivo.',
      'Transfiere Bs 50 de efectivo a pago móvil.',
    ],
    expects: ['El total final de Efectivo pasa de Bs 100 a Bs 50.'],
    data: 'Venta de Bs 100 en efectivo; transferencia de Bs 50 a pago móvil.',
  }),
  async ({ page }) => {
    // Arrange
    await gotoDashboard(page);
    await createWaterSale(page, {
      basePriceBs: 100,
      splits: [{ method: 'efectivo', amountBs: 100 }],
      noteMarker: 'E2E-FIN03',
    });
    await openPaymentBalancePage(page);
    const before = await balanceAmount(page, 'Efectivo', 'final');

    // Act
    await createBalanceTransfer(page, {
      operationType: 'equilibrio',
      fromMethod: 'efectivo',
      toMethod: 'pago_movil',
      amountOutBs: 50,
      amountInBs: 50,
    });

    // Assert
    await expect
      .poll(() => balanceAmount(page, 'Efectivo', 'final'), {
        timeout: 5_000,
      })
      .toBeCloseTo(before - 50, 1);
  }
);
