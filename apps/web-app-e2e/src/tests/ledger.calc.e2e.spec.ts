import { expect, test } from '@playwright/test';
import {
  addRecord,
  computeExpected,
  emptyLedger,
  removeRecord,
  setTipPayout,
  transferDifferenceBs,
} from '../support/ledger/ledger';
import type { Ledger, LedgerRecord } from '../support/ledger/types';
import { METHODS } from '../support/ledger/types';
import { documented } from '../support/testDoc';

// Pure arithmetic checks: no browser and no database.
const AREA = 'Herramientas de prueba (internas)';
const RATE = 1000;

const build = (...records: LedgerRecord[]): Ledger =>
  records.reduce(addRecord, emptyLedger(RATE));

const sale = (
  id: string,
  baseBs: number,
  primary: 'efectivo' | 'pago_movil' | 'punto_venta' | 'divisa',
  extra: Partial<Extract<LedgerRecord, { kind: 'sale' }>> = {}
): LedgerRecord => ({
  kind: 'sale',
  id,
  baseBs,
  payment: { primary },
  ...extra,
});

test.describe('ledger calculator', () => {
  test(
    'the example day adds up to the agreed figures',
    documented({
      titulo: 'El día de ejemplo da las cifras acordadas',
      area: AREA,
      intent:
        'Comprobar la calculadora con un día completo: venta, venta con propina pagada, alquiler, egreso y equilibrio.',
      steps: [
        'Registra una recarga de 700 en efectivo, otra de 700 en efectivo con propina de 100 capturada en pago móvil y pagada en efectivo.',
        'Añade un alquiler completo pagado en pago móvil, un egreso de 1500 en efectivo y un equilibrio de 2000 de pago móvil a efectivo.',
      ],
      expects: [
        'Ingresos 7500, egresos 1600 y neto 5900.',
        '5 transacciones (las 2 ventas, el alquiler, el pago de la propina y el equilibrio).',
        'Efectivo 1800 y Pago Móvil 4100; Punto de Venta y Divisa en 0.',
      ],
    }),
    async () => {
      // Arrange
      const ledger = build(
        sale('w1', 700, 'efectivo'),
        sale('w4', 700, 'efectivo', {
          tip: {
            amountBs: 100,
            captureMethod: 'pago_movil',
            payoutMethod: 'efectivo',
          },
        }),
        {
          kind: 'rental',
          id: 'r1',
          shift: 'completo',
          deliveryFeeUsd: 0,
          payment: { primary: 'pago_movil' },
          isPaid: true,
        },
        {
          kind: 'expense',
          id: 'e1',
          amountBs: 1500,
          payment: { primary: 'efectivo' },
        },
        {
          kind: 'transfer',
          id: 't1',
          from: 'pago_movil',
          to: 'efectivo',
          outBs: 2000,
          inBs: 2000,
        }
      );

      // Act
      const expected = computeExpected(ledger);

      // Assert
      expect(expected.incomeBs).toBe(7500);
      expect(expected.expenseBs).toBe(1600);
      expect(expected.netBs).toBe(5900);
      expect(expected.transactions).toBe(5);
      expect(expected.cards).toEqual({
        efectivo: 1800,
        pago_movil: 4100,
        punto_venta: 0,
        divisa: 0,
      });
    }
  );

  test(
    'mixed payments split a total and a tip joins its capture method',
    documented({
      titulo: 'El pago mixto reparte el total y la propina va a su método',
      area: AREA,
      intent:
        'Comprobar el reparto de una venta mixta, una propina en otro método y un alquiler mixto.',
      steps: [
        'Venta de 1400: efectivo con 500 en pago móvil.',
        'Venta de 700 en efectivo con propina de 100 capturada en efectivo.',
        'Alquiler completo pagado: 4000 en pago móvil y 2000 en efectivo.',
      ],
      expects: [
        'La venta mixta suma 900 a efectivo y 500 a pago móvil.',
        'Una propina en el mismo método no crea reparto aparte: efectivo recibe 800.',
        'El alquiler mixto reparte 6000 en 4000 y 2000.',
        'Hay 1 propina pendiente.',
      ],
    }),
    async () => {
      // Arrange
      const ledger = build(
        sale('w3', 1400, 'efectivo', {
          payment: {
            primary: 'efectivo',
            secondary: { method: 'pago_movil', amountBs: 500 },
          },
        }),
        sale('w5', 700, 'efectivo', {
          tip: { amountBs: 100, captureMethod: 'efectivo' },
        }),
        {
          kind: 'rental',
          id: 'r5',
          shift: 'completo',
          deliveryFeeUsd: 0,
          payment: {
            primary: 'pago_movil',
            secondary: { method: 'efectivo', amountBs: 2000 },
          },
          isPaid: true,
        }
      );

      // Act
      const expected = computeExpected(ledger);

      // Assert
      expect(expected.cards.efectivo).toBe(900 + 800 + 2000);
      expect(expected.cards.pago_movil).toBe(500 + 4000);
      expect(expected.incomeBs).toBe(1400 + 800 + 6000);
      expect(expected.pendingTips).toBe(1);
    }
  );

  test(
    'rental prices follow the shift, the divisa price and the delivery fee',
    documented({
      titulo: 'El precio del alquiler sigue turno, divisa y entrega',
      area: AREA,
      intent:
        'Comprobar la tabla de precios: medio 4, completo 6 (5 en divisa), doble 12, más la tarifa de entrega.',
      steps: [
        'Calcula un alquiler pagado de cada turno y uno completo en divisa con entrega de $2.',
        'Añade un alquiler pendiente.',
      ],
      expects: [
        'Medio 4000, completo 6000 y doble 12000.',
        'Completo en divisa con entrega de $2 suma 7000 a divisa.',
        'El alquiler pendiente no aporta ingresos ni transacciones.',
      ],
    }),
    async () => {
      // Arrange
      const rental = (
        id: string,
        shift: 'medio' | 'completo' | 'doble',
        primary: 'efectivo' | 'divisa',
        isPaid: boolean,
        deliveryFeeUsd = 0
      ): LedgerRecord => ({
        kind: 'rental',
        id,
        shift,
        deliveryFeeUsd,
        payment: { primary },
        isPaid,
      });

      // Act
      const medio = computeExpected(
        build(rental('a', 'medio', 'efectivo', true))
      );
      const completo = computeExpected(
        build(rental('b', 'completo', 'efectivo', true))
      );
      const doble = computeExpected(
        build(rental('c', 'doble', 'efectivo', true))
      );
      const divisa = computeExpected(
        build(rental('d', 'completo', 'divisa', true, 2))
      );
      const pending = computeExpected(
        build(rental('e', 'doble', 'efectivo', false))
      );

      // Assert
      expect(medio.incomeBs).toBe(4000);
      expect(completo.incomeBs).toBe(6000);
      expect(doble.incomeBs).toBe(12000);
      expect(divisa.cards.divisa).toBe(7000);
      expect(pending.incomeBs).toBe(0);
      expect(pending.transactions).toBe(0);
    }
  );

  test(
    'expenses, prepaid orders, tip payouts and transfers move the cards',
    documented({
      titulo:
        'Egresos, prepagos, propinas pagadas y transferencias mueven las tarjetas',
      area: AREA,
      intent:
        'Comprobar cómo cada movimiento afecta ingresos, egresos, transacciones y tarjetas.',
      steps: [
        'Egreso mixto de 400 (300 en pago móvil, 100 en efectivo).',
        'Prepago de 700 en pago móvil.',
        'Avance de punto de venta a efectivo: sale 5000 y entra 4500.',
      ],
      expects: [
        'El egreso mixto resta 300 a pago móvil y 100 a efectivo, sin contar como transacción.',
        'El prepago suma 700 a ingresos y a pago móvil, sin contar como transacción.',
        'El avance resta 5000 a punto de venta, suma 4500 a efectivo y cuenta 1 transacción.',
      ],
    }),
    async () => {
      // Arrange
      const ledger = build(
        {
          kind: 'expense',
          id: 'e2',
          amountBs: 400,
          payment: {
            primary: 'pago_movil',
            secondary: { method: 'efectivo', amountBs: 100 },
          },
        },
        { kind: 'prepaid', id: 'p1', amountBs: 700, method: 'pago_movil' },
        {
          kind: 'transfer',
          id: 't2',
          from: 'punto_venta',
          to: 'efectivo',
          outBs: 5000,
          inBs: 4500,
        }
      );

      // Act
      const expected = computeExpected(ledger);

      // Assert
      expect(expected.cards).toEqual({
        efectivo: -100 + 4500,
        pago_movil: -300 + 700,
        punto_venta: -5000,
        divisa: 0,
      });
      expect(expected.incomeBs).toBe(700);
      expect(expected.expenseBs).toBe(400);
      expect(expected.transactions).toBe(1);
    }
  );

  test(
    'deleting a record removes its tip and the cards keep their invariant',
    documented({
      titulo:
        'Borrar un registro quita su propina y las tarjetas siguen cuadrando',
      area: AREA,
      intent:
        'Comprobar el borrado y la regla: suma de tarjetas = neto + diferencias de los avances.',
      steps: [
        'Registra una venta con propina pagada, un egreso y un avance con diferencia.',
        'Comprueba la suma de tarjetas, borra la venta y vuelve a comprobar.',
      ],
      expects: [
        'Con los tres registros, la suma de tarjetas es igual al neto más la diferencia del avance (−500).',
        'Al borrar la venta desaparecen sus ingresos, su propina y el pago de la propina.',
        'La regla de la suma de tarjetas se sigue cumpliendo.',
      ],
    }),
    async () => {
      // Arrange
      const full = build(
        sale('w', 1000, 'efectivo', {
          tip: {
            amountBs: 200,
            captureMethod: 'punto_venta',
            payoutMethod: 'pago_movil',
          },
        }),
        {
          kind: 'expense',
          id: 'e',
          amountBs: 300,
          payment: { primary: 'efectivo' },
        },
        {
          kind: 'transfer',
          id: 't',
          from: 'punto_venta',
          to: 'efectivo',
          outBs: 5000,
          inBs: 4500,
        }
      );
      const sumCards = (ledger: Ledger) => {
        const expected = computeExpected(ledger);
        return METHODS.reduce((sum, method) => sum + expected.cards[method], 0);
      };

      // Act
      const before = computeExpected(full);
      const after = computeExpected(removeRecord(full, 'w'));

      // Assert
      expect(sumCards(full)).toBe(before.netBs + transferDifferenceBs(full));
      expect(before.incomeBs).toBe(1200);
      expect(before.paidTips).toBe(1);
      expect(after.incomeBs).toBe(0);
      expect(after.paidTips).toBe(0);
      expect(after.transactions).toBe(1);
      const afterLedger = removeRecord(full, 'w');
      expect(sumCards(afterLedger)).toBe(
        after.netBs + transferDifferenceBs(afterLedger)
      );
    }
  );

  test(
    'paying a tip moves money out of the payout method',
    documented({
      titulo: 'Pagar una propina saca el dinero del método de pago',
      area: AREA,
      intent: 'Comprobar el ciclo de una propina: pendiente y luego pagada.',
      steps: [
        'Registra una venta de 700 en efectivo con propina de 100 capturada en pago móvil.',
        'Marca la propina como pagada desde efectivo.',
      ],
      expects: [
        'Pendiente: pago móvil +100, 0 egresos y 1 propina pendiente.',
        'Pagada: efectivo baja 100, egresos 100, 1 transacción más y 1 propina pagada.',
        'Los ingresos no cambian al pagar.',
      ],
    }),
    async () => {
      // Arrange
      const pending = build(
        sale('w', 700, 'efectivo', {
          tip: { amountBs: 100, captureMethod: 'pago_movil' },
        })
      );

      // Act
      const paid = setTipPayout(pending, 'w', 'efectivo');
      const before = computeExpected(pending);
      const after = computeExpected(paid);

      // Assert
      expect(before.cards.pago_movil).toBe(100);
      expect(before.expenseBs).toBe(0);
      expect(before.pendingTips).toBe(1);
      expect(after.cards.efectivo).toBe(before.cards.efectivo - 100);
      expect(after.expenseBs).toBe(100);
      expect(after.transactions).toBe(before.transactions + 1);
      expect(after.paidTips).toBe(1);
      expect(after.incomeBs).toBe(before.incomeBs);
    }
  );
});
