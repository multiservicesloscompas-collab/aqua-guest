export interface BugKnowledge {
  cause: string;
  fix: string;
  where: string;
}

export const BUG_KNOWLEDGE = {
  B1: {
    cause:
      'La tienda de propinas mezcla lo que carga con lo que ya tenía en un Map y nunca descarta las propinas que desaparecieron del rango.',
    fix: 'Antes de mezclar, quitar de la caché las propinas cuyo día cae dentro del rango cargado (en la variante de pagadas, solo las pagadas, para no sacar las pendientes).',
    where:
      'store/useTipStore.ts · loadTipsByDateRange y loadPaidTipsByDateRange (normalizeToVenezuelaDate ya existe)',
  },
  B2: {
    cause:
      'Un useEffect reinicia todos los campos del formulario cada vez que cambia `rental` o `exchangeRate`, y `rental` cambia de identidad con cualquier refresco de la tienda.',
    fix: 'Inicializar el estado una sola vez desde el alquiler (inicializador perezoso) y poner key={rental.id} en EditRentalSheet para que cambiar de alquiler sí reinicie.',
    where:
      'pages/RentalsPage/hooks/useEditRentalFormState.ts:39-60 · EditRentalSheet.tsx',
  },
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
  B9: {
    cause:
      'La excepción de las 13:00/14:00 en calculatePickupTime fija las 20:00 del mismo día; vale de lunes a sábado (cierre 20:00) pero el domingo la tienda cierra a las 14:00.',
    fix: 'Aplicar la excepción solo si el día de retiro no es domingo; el domingo cae en clampToBusinessHours, que ya da lunes 09:00. Hay que actualizar el test unitario que hoy fija las 20:00 del domingo.',
    where: 'utils/rentalSchedule.ts · calculatePickupTime (rama 13:00/14:00)',
  },
  B10: {
    cause:
      'El efecto de hidratación de la edición de venta vuelve a cargar el formulario cuando llega la propina y pisa lo que el usuario ya escribió (misma clase que B2).',
    fix: 'Inicializar el formulario una vez y aplicar la propina sin reiniciar los campos que el usuario ya tocó; corregir junto con B3 porque ambos viven en la misma hidratación.',
    where: 'components/ventas/useEditSaleSheetViewModel.ts (líneas ~88-138)',
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
  'FIN-06': {
    cause:
      'Las pantallas de Transacciones y detalle de método no llaman a ningún cargador de rango al navegar a otro mes, así que solo ven lo ya cargado.',
    fix: 'Llamar a los cargadores por rango de ventas, alquileres y egresos cuando cambia la fecha navegada.',
    where:
      'pages/TransactionsSummaryPage/TransactionsSummaryPage.tsx · usePaymentMethodDetailViewModel.ts',
  },
  'FIN-09': {
    cause:
      'La página de métricas suma todos los egresos que hay en la tienda, sin filtrar por el período seleccionado.',
    fix: 'Filtrar los egresos por el rango de fechas del período antes de sumarlos.',
    where: 'pages/EgresosMetricsPage/index.tsx:14-19',
  },
  'FIN-11': {
    cause:
      'La lógica del formulario de equilibrio no valida el saldo disponible ni que la tasa sea mayor a 0 (con tasa 0 el cálculo da Infinity).',
    fix: 'Bloquear la transferencia si el monto supera el saldo del método de origen o si la tasa no es positiva.',
    where: 'paymentBalanceFormLogic.ts:55-79 (líneas 93 y 97 para la tasa)',
  },
} as const satisfies Record<string, BugKnowledge>;

export type BugId = keyof typeof BUG_KNOWLEDGE;
