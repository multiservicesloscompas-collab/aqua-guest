export interface BugKnowledge {
  cause: string;
  fix: string;
  where: string;
}

export const BUG_KNOWLEDGE = {
  B4: {
    cause:
      'Los ayudantes de atribución solo confían en los pagos guardados cuando el pago es mixto (2+ métodos distintos); con un solo pago recalculan totalUsd × tasa de hoy.',
    fix: 'Agregar hasPersistedPaymentSplits (lista no vacía de pagos válidos con monto positivo), usarlo en los tres ayudantes de alquiler y sumar todos los pagos del método pedido.',
    where:
      'services/payments/paymentSplitValidity.ts:13 · paymentSplitAttribution.ts:61-98',
  },
  B7: {
    cause:
      "La edición decide el precio del turno Completo con paymentMethod === 'efectivo' y la creación usa 'divisa'; la regla está duplicada y al revés. Es solo de visualización: el monto que se cobra es correcto.",
    fix: 'Que ambos mapShiftOptions llamen a calculateRentalPrice(key, paymentMethod, 0) y borrar la condición duplicada.',
    where:
      'pages/RentalsPage/hooks/editRentalSheetViewModel.helpers.ts:112 · rentalSheetViewModel.helpers.ts:78 · utils/rentalPricing.ts:9',
  },
  C1: {
    cause:
      'Los ayudantes de encolado escriben claves de negocio (sale:temp-x) en dependsOn, pero el orquestador global solo compara contra ids de acción en completedIds; además el origin_id temporal de la propina solo se remapea para pagos (C2). Latente: la bandera está apagada por defecto y corre el procesador legado.',
    fix: 'Que el orquestador resuelva dependsOn por clave de negocio (o que el encolado use ids de acción) y que resolveInsertPayload remapee también el origin_id de las propinas. Hacerlo antes de encender la bandera en producción.',
    where:
      'store/useSyncStore.ts:42 · offline/globalOrchestrator.ts:55,164 · offline/orchestratorMutations.ts:16-47',
  },
  C12: {
    cause:
      'Transacciones formatea los totales con toLocaleString sin opciones (0 a 3 decimales) y Lavadoras métricas solo fija el mínimo de 2; el resto de la app muestra siempre 2 decimales. Pendiente de confirmar el formato correcto con el usuario.',
    fix: 'Usar el formateador de bolívares común con exactamente 2 decimales en ambas pantallas (cambia lo que ve el usuario: decidir primero).',
    where:
      'pages/TransactionsSummaryPage/components/TransactionsSummaryTotals.tsx:20,28 · pages/LavadorasMetricsPage/index.tsx:179',
  },
  'FIN-01': {
    cause:
      'DashboardMetricsService convierte el ingreso del alquiler con la tasa de hoy (totalUsd × exchangeRate) en vez de usar los pagos guardados, que sí usan las tarjetas por método.',
    fix: 'Calcular rentalBs desde la misma fuente que las tarjetas (sumar rentalsTotals). Solo los alquileres sin pagos guardados conservan totalUsd × tasa actual.',
    where:
      'services/DashboardMetricsService.ts:138-153 · pages/TransactionsSummaryPage/services/buildTransactionsSummaryItems.ts:170',
  },
  'FIN-02': {
    cause:
      'Transacciones cuenta la pata de entrada de un equilibrio (transferencia entre métodos) como ingreso.',
    fix: 'Excluir las entradas de equilibrio del ingreso, igual que el dashboard.',
    where:
      'pages/TransactionsSummaryPage/services/buildTransactionsSummaryItems.ts:262 · TransactionsSummaryPage.tsx:68',
  },
  'FIN-04': {
    cause:
      'Equilibrio agrupa el alquiler por `date || datePaid` (fecha del servicio) mientras el dashboard usa datePaid (fecha de pago).',
    fix: 'Usar datePaid en Equilibrio, como DashboardMetricsService.',
    where:
      'paymentBalanceSummary.ts:56-59 · DashboardMetricsService.ts:113 (referencia)',
  },
  'FIN-09': {
    cause:
      'La página de métricas suma todos los egresos que hay en la tienda, sin filtrar por el período seleccionado.',
    fix: 'Filtrar los egresos por el rango de fechas del período antes de sumarlos.',
    where: 'pages/EgresosMetricsPage/index.tsx:14-19',
  },
} as const satisfies Record<string, BugKnowledge>;

export type BugId = keyof typeof BUG_KNOWLEDGE;
