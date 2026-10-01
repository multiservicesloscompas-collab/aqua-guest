import { expect, test } from '@playwright/test';
import { registerSaleOffline } from '../../support/offlineSale';
import { bugDoc } from '../../support/bugs/ficha';
import { useCleanDomain } from '../../support/bugs/setup';

useCleanDomain();

test.describe('Sin conexión (rojos)', () => {
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
