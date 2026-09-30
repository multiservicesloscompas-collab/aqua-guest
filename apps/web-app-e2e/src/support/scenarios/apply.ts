import {
  addRecord,
  removeRecord,
  setTipPayout,
  updateRecord,
} from '../ledger/ledger';
import type { Expected, Ledger, Method, Payment } from '../ledger/types';
import { METHODS } from '../ledger/types';
import type { Step } from './types';

export const METHOD_LABEL: Record<Method, string> = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisa',
};

function applyEdit(
  ledger: Ledger,
  step: Extract<Step, { type: 'edit' }>
): Ledger {
  const record = ledger.records.find((r) => r.id === step.targetId);
  if (!record) throw new Error(`Nothing to edit for «${step.targetId}»`);
  if (record.kind === 'prepaid' || record.kind === 'transfer') {
    throw new Error(`A ${record.kind} cannot be edited`);
  }
  if (record.payment.secondary || ('tip' in record && record.tip)) {
    throw new Error(
      `«${step.targetId}» has a mixed payment or a tip: editing those is not covered`
    );
  }
  const payment = step.primary ? { primary: step.primary } : record.payment;
  if (record.kind === 'sale') {
    return updateRecord(ledger, record.id, {
      baseBs: step.amountBs ?? record.baseBs,
      payment,
    });
  }
  if (record.kind === 'expense') {
    return updateRecord(ledger, record.id, {
      amountBs: step.amountBs ?? record.amountBs,
      payment,
    });
  }
  return updateRecord(ledger, record.id, {
    shift: step.shift ?? record.shift,
    payment,
  });
}

/** The expected effect of a step on the ledger. */
export function applyStep(ledger: Ledger, step: Step): Ledger {
  switch (step.type) {
    case 'sale':
      return addRecord(ledger, {
        kind: 'sale',
        id: step.id,
        baseBs: step.baseBs,
        payment: step.payment,
        tip: step.tip,
      });
    case 'rental':
      return addRecord(ledger, {
        kind: 'rental',
        id: step.id,
        shift: step.shift,
        deliveryFeeUsd: step.deliveryFeeUsd ?? 0,
        payment: step.payment,
        isPaid: step.isPaid,
        tip: step.tip,
      });
    case 'expense':
      return addRecord(ledger, {
        kind: 'expense',
        id: step.id,
        amountBs: step.amountBs,
        payment: step.payment,
      });
    case 'transfer':
      return addRecord(ledger, {
        kind: 'transfer',
        id: step.id,
        from: step.from,
        to: step.to,
        outBs: step.outBs,
        inBs: step.inBs,
      });
    case 'payTip':
      return setTipPayout(ledger, step.originId, step.method);
    case 'markPaid':
      return updateRecord(ledger, step.rentalId, { isPaid: true });
    case 'delete':
      return removeRecord(ledger, step.targetId);
    case 'edit':
      return applyEdit(ledger, step);
  }
}

function describePayment(payment: Payment): string {
  if (!payment.secondary) return `en ${METHOD_LABEL[payment.primary]}`;
  return `mixto (${METHOD_LABEL[payment.primary]} + Bs ${
    payment.secondary.amountBs
  } en ${METHOD_LABEL[payment.secondary.method]})`;
}

const RENTAL_SHIFT_LABEL = {
  medio: 'medio turno',
  completo: 'turno completo',
  doble: 'turno doble',
} as const;

/** Plain-Spanish sentence for a step, used in fichas and in failure messages. */
export function describeStep(step: Step): string {
  switch (step.type) {
    case 'sale': {
      const tip = step.tip
        ? `, con propina de Bs ${step.tip.amountBs} capturada en ${
            METHOD_LABEL[step.tip.captureMethod]
          }`
        : '';
      return `Venta de agua de Bs ${step.baseBs}, pago ${describePayment(
        step.payment
      )}${tip}`;
    }
    case 'rental': {
      const fee = step.deliveryFeeUsd
        ? ` con entrega de $${step.deliveryFeeUsd}`
        : '';
      const tip = step.tip
        ? `, con propina de Bs ${step.tip.amountBs} capturada en ${
            METHOD_LABEL[step.tip.captureMethod]
          }`
        : '';
      return `Alquiler de ${RENTAL_SHIFT_LABEL[step.shift]}${fee} (${
        step.isPaid ? 'pagado' : 'pendiente'
      }), pago ${describePayment(step.payment)}${tip}`;
    }
    case 'expense':
      return `Egreso de Bs ${step.amountBs}, pago ${describePayment(
        step.payment
      )}`;
    case 'transfer':
      return step.outBs === step.inBs
        ? `Equilibrio de Bs ${step.outBs} de ${METHOD_LABEL[step.from]} a ${
            METHOD_LABEL[step.to]
          }`
        : `Avance: sale Bs ${step.outBs} de ${
            METHOD_LABEL[step.from]
          } y entra Bs ${step.inBs} en ${METHOD_LABEL[step.to]}`;
    case 'payTip':
      return `Pagar la propina de «${step.originId}» desde ${
        METHOD_LABEL[step.method]
      }`;
    case 'markPaid':
      return `Marcar como pagado el alquiler «${step.rentalId}»`;
    case 'delete':
      return `Eliminar el registro «${step.targetId}»`;
    case 'edit': {
      const changes = [
        step.amountBs !== undefined ? `monto a Bs ${step.amountBs}` : '',
        step.shift ? `turno a ${RENTAL_SHIFT_LABEL[step.shift]}` : '',
        step.primary ? `método a ${METHOD_LABEL[step.primary]}` : '',
      ].filter(Boolean);
      return `Editar «${step.targetId}»: ${changes.join(' y ')}`;
    }
  }
}

/** One line with the figures the dashboard must show after a step. */
export function describeExpected(expected: Expected): string {
  const cards = METHODS.map(
    (method) => `${METHOD_LABEL[method]} ${expected.cards[method]}`
  ).join(' · ');
  return `ingresos ${expected.incomeBs} · egresos ${
    expected.expenseBs
  } · neto ${expected.netBs} · ${expected.transactions} ${
    expected.transactions === 1 ? 'transacción' : 'transacciones'
  } · ${cards}`;
}
