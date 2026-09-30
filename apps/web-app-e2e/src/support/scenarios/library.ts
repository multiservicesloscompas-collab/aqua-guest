import type { Scenario } from './types';

/** Scenarios that must stay green. Figures are derived by the ledger calculator. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'venta-mixta-y-alquiler-con-propina',
    titulo: 'Venta mixta + alquiler con propina',
    area: 'Combinados',
    intent:
      'Comprobar que una venta de agua con pago mixto y un alquiler con propina se suman bien en el dashboard.',
    steps: [
      {
        type: 'sale',
        id: 'venta-mixta',
        baseBs: 1400,
        payment: {
          primary: 'efectivo',
          secondary: { method: 'pago_movil', amountBs: 500 },
        },
      },
      {
        type: 'rental',
        id: 'alquiler-propina',
        shift: 'completo',
        payment: { primary: 'pago_movil' },
        isPaid: true,
        tip: { amountBs: 100, captureMethod: 'efectivo' },
      },
    ],
  },
  {
    id: 'dia-de-ejemplo',
    titulo:
      'Día completo con venta, propina pagada, alquiler, egreso y equilibrio',
    area: 'Combinados',
    intent:
      'Comprobar el día de ejemplo acordado: ingresos 7500, egresos 1600, neto 5900 y 5 transacciones.',
    steps: [
      { type: 'sale', id: 'w1', baseBs: 700, payment: { primary: 'efectivo' } },
      {
        type: 'sale',
        id: 'w4',
        baseBs: 700,
        payment: { primary: 'efectivo' },
        tip: { amountBs: 100, captureMethod: 'pago_movil' },
      },
      { type: 'payTip', originId: 'w4', method: 'efectivo' },
      {
        type: 'rental',
        id: 'r1',
        shift: 'completo',
        payment: { primary: 'pago_movil' },
        isPaid: true,
      },
      {
        type: 'expense',
        id: 'e1',
        amountBs: 1500,
        payment: { primary: 'efectivo' },
      },
      {
        type: 'transfer',
        id: 't1',
        from: 'pago_movil',
        to: 'efectivo',
        outBs: 2000,
        inBs: 2000,
      },
    ],
  },
  {
    id: 'alquiler-pendiente-luego-pagado',
    titulo: 'Alquiler pendiente que luego se marca como pagado',
    area: 'Alquileres',
    intent:
      'Comprobar que un alquiler pendiente no suma nada y que al marcarlo como pagado entra al dashboard.',
    steps: [
      {
        type: 'rental',
        id: 'pendiente',
        shift: 'medio',
        payment: { primary: 'efectivo' },
        isPaid: false,
      },
      { type: 'markPaid', rentalId: 'pendiente' },
    ],
  },
  {
    id: 'borrar-egreso-y-alquiler',
    titulo: 'Borrar un egreso y un alquiler devuelve las cifras anteriores',
    area: 'Combinados',
    intent:
      'Comprobar que al eliminar un egreso y un alquiler el dashboard vuelve a los números previos.',
    steps: [
      { type: 'sale', id: 'v', baseBs: 700, payment: { primary: 'efectivo' } },
      {
        type: 'expense',
        id: 'e',
        amountBs: 300,
        payment: { primary: 'efectivo' },
      },
      {
        type: 'rental',
        id: 'r',
        shift: 'completo',
        payment: { primary: 'pago_movil' },
        isPaid: true,
      },
      { type: 'delete', targetId: 'e' },
      { type: 'delete', targetId: 'r' },
    ],
  },
  {
    id: 'borrar-venta-con-propina-pagada',
    titulo: 'Borrar una venta con propina pagada',
    area: 'Propinas',
    intent:
      'Comprobar qué pasa con el pago de una propina cuando se elimina la venta que la originó.',
    steps: [
      {
        type: 'sale',
        id: 'v',
        baseBs: 700,
        payment: { primary: 'efectivo' },
        tip: { amountBs: 100, captureMethod: 'pago_movil' },
      },
      { type: 'payTip', originId: 'v', method: 'efectivo' },
      { type: 'delete', targetId: 'v' },
    ],
  },
  {
    id: 'mixto-en-todas-partes',
    titulo: 'Pago mixto en venta, alquiler y egreso',
    area: 'Combinados',
    intent:
      'Comprobar que los pagos mixtos de una venta, un alquiler y un egreso se reparten bien entre las tarjetas.',
    steps: [
      {
        type: 'sale',
        id: 'venta',
        baseBs: 1400,
        payment: {
          primary: 'efectivo',
          secondary: { method: 'pago_movil', amountBs: 500 },
        },
      },
      {
        type: 'rental',
        id: 'alquiler',
        shift: 'completo',
        payment: {
          primary: 'pago_movil',
          secondary: { method: 'efectivo', amountBs: 2000 },
        },
        isPaid: true,
      },
      {
        type: 'expense',
        id: 'egreso',
        amountBs: 400,
        payment: {
          primary: 'pago_movil',
          secondary: { method: 'efectivo', amountBs: 100 },
        },
      },
    ],
  },
  {
    id: 'alquiler-en-divisa-con-entrega',
    titulo: 'Alquiler completo en divisa con entrega de $2',
    area: 'Alquileres',
    intent:
      'Comprobar el precio especial en divisa ($5) más la tarifa de entrega y su efecto en la tarjeta de Divisa.',
    steps: [
      {
        type: 'rental',
        id: 'divisa',
        shift: 'completo',
        deliveryFeeUsd: 2,
        payment: { primary: 'divisa' },
        isPaid: true,
      },
    ],
  },
  {
    id: 'propina-de-alquiler-pagada',
    titulo: 'Propina de un alquiler capturada en un método y pagada en otro',
    area: 'Propinas',
    intent:
      'Comprobar el ciclo completo de la propina de un alquiler: pendiente y luego pagada desde otro método.',
    steps: [
      {
        type: 'rental',
        id: 'alquiler',
        shift: 'doble',
        payment: { primary: 'pago_movil' },
        isPaid: true,
        tip: { amountBs: 300, captureMethod: 'punto_venta' },
      },
      { type: 'payTip', originId: 'alquiler', method: 'efectivo' },
    ],
  },
  {
    id: 'avance-con-diferencia',
    titulo: 'Avance de punto de venta a efectivo con diferencia',
    area: 'Transferencias',
    intent:
      'Comprobar que un avance mueve dinero entre tarjetas y que la diferencia no cuenta como ingreso ni egreso.',
    steps: [
      {
        type: 'sale',
        id: 'venta',
        baseBs: 6000,
        payment: { primary: 'punto_venta' },
      },
      {
        type: 'transfer',
        id: 'avance',
        from: 'punto_venta',
        to: 'efectivo',
        outBs: 5000,
        inBs: 4500,
      },
    ],
  },
  {
    id: 'editar-venta-egreso-y-alquiler',
    titulo: 'Editar una venta, un egreso y un alquiler',
    area: 'Combinados',
    intent:
      'Comprobar que editar el monto, el turno o el método de pago reacomoda las cifras del dashboard.',
    steps: [
      {
        type: 'sale',
        id: 'venta',
        baseBs: 1000,
        payment: { primary: 'efectivo' },
      },
      {
        type: 'expense',
        id: 'egreso',
        amountBs: 300,
        payment: { primary: 'efectivo' },
      },
      {
        type: 'rental',
        id: 'alquiler',
        shift: 'medio',
        payment: { primary: 'pago_movil' },
        isPaid: true,
      },
      {
        type: 'edit',
        targetId: 'venta',
        amountBs: 1500,
        primary: 'punto_venta',
      },
      { type: 'edit', targetId: 'egreso', amountBs: 450 },
      { type: 'edit', targetId: 'alquiler', shift: 'doble' },
    ],
  },
  {
    id: 'mixto-con-divisa',
    titulo: 'Pago mixto con Divisa como método secundario',
    area: 'Combinados',
    intent:
      'Comprobar que un pago mixto en venta, alquiler y egreso con Divisa como segundo método se reparte bien.',
    steps: [
      {
        type: 'sale',
        id: 'venta',
        baseBs: 2000,
        payment: {
          primary: 'punto_venta',
          secondary: { method: 'divisa', amountBs: 500 },
        },
      },
      {
        type: 'rental',
        id: 'alquiler',
        shift: 'completo',
        payment: {
          primary: 'efectivo',
          secondary: { method: 'divisa', amountBs: 1000 },
        },
        isPaid: true,
      },
      {
        type: 'expense',
        id: 'egreso',
        amountBs: 600,
        payment: {
          primary: 'efectivo',
          secondary: { method: 'divisa', amountBs: 200 },
        },
      },
    ],
  },
  {
    id: 'borrar-equilibrio',
    titulo: 'Borrar un equilibrio devuelve el dinero a su método',
    area: 'Transferencias',
    intent:
      'Comprobar que al eliminar una transferencia entre métodos las tarjetas y las transacciones vuelven a su estado anterior.',
    steps: [
      {
        type: 'sale',
        id: 'venta',
        baseBs: 1000,
        payment: { primary: 'efectivo' },
      },
      {
        type: 'transfer',
        id: 'equilibrio',
        from: 'efectivo',
        to: 'pago_movil',
        outBs: 400,
        inBs: 400,
      },
      { type: 'delete', targetId: 'equilibrio' },
    ],
  },
];
