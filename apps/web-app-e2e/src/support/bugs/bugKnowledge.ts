/**
 * What we know about each open bug beyond the test itself: why it happens, what
 * to change so the spec turns green, and where. Sources: docs/audit/production-bugs.md
 * and the `*.bugs.e2e.spec.md` tables. Line numbers come from the audit; re-grep before fixing.
 *
 * `fix` is a proposal, not a verified patch. The flow is still: the user confirms
 * the red test, then one bug is fixed at a time (docs/agents/workflow.md).
 */
export interface BugKnowledge {
  /** Plain-language root cause (why the app behaves wrong). */
  cause: string;
  /** What to change so the test stops failing. */
  fix: string;
  /** Files and functions to touch. */
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
  B3: {
    cause:
      'Los pagos guardados ya incluyen la propina, pero el formulario los hidrata sin restarla y al guardar la tienda la suma otra vez.',
    fix: 'Pasar tipAmountBs y tipPaymentMethod a la hidratación, restar la propina del pago que coincide antes de armar el formulario y rehidratar cuando la propina termine de cargar. No cambiar el contrato de la tienda.',
    where:
      'services/payments/paymentSplitFormHydration.ts:35-70 · components/ventas/useEditSaleSheetViewModel.ts · mergeTipIntoPaymentSplits (transactionTotals.ts:101)',
  },
  B4: {
    cause:
      'Los ayudantes de atribución solo confían en los pagos guardados cuando el pago es mixto (2+ métodos distintos); con un solo pago recalculan totalUsd × tasa de hoy.',
    fix: 'Agregar hasPersistedPaymentSplits (lista no vacía de pagos válidos con monto positivo), usarlo en los tres ayudantes de alquiler y sumar todos los pagos del método pedido.',
    where:
      'services/payments/paymentSplitValidity.ts:13 · paymentSplitAttribution.ts:61-98',
  },
  B6: {
    cause:
      'La rama sin conexión de deleteRental encola el borrado de la propina pero no la quita de la tienda en memoria; la rama con conexión sí llama removeTipByOrigin.',
    fix: "Llamar useTipStore.getState().removeTipByOrigin('rental', id) también en la rama sin conexión (y revisar si deleteSale tiene la misma asimetría).",
    where: 'store/useRentalStore.actions.ts:164-187',
  },
  B7: {
    cause:
      "La edición decide el precio del turno Completo con paymentMethod === 'efectivo' y la creación usa 'divisa'; la regla está duplicada y al revés. Es solo de visualización: el monto que se cobra es correcto.",
    fix: 'Que ambos mapShiftOptions llamen a calculateRentalPrice(key, paymentMethod, 0) y borrar la condición duplicada.',
    where:
      'pages/RentalsPage/hooks/editRentalSheetViewModel.helpers.ts:112 · rentalSheetViewModel.helpers.ts:78 · utils/rentalPricing.ts:9',
  },
  B8: {
    cause:
      'setProductPrice sale temprano cuando no hay conexión y no encola nada; además products es de solo lectura en la matriz offline.',
    fix: 'Encolar un UPDATE offline de products (ver docs/agents/offline-sync.md, hay que habilitar mutaciones en coverageMatrix) y mostrar error si la fila del producto no existe. Confirmar antes con datos de producción.',
    where:
      'store/useConfigStore.ts:222 setProductPrice · offline/coverageMatrix.ts · pages/WaterPricingConfigPage.tsx:70',
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
  'FIN-03': {
    cause:
      'El resumen se calcula en un useMemo sin las dependencias de estado, así que no se recalcula al registrar una transferencia.',
    fix: 'Agregar al useMemo las dependencias reales (transferencias, ventas, alquileres, egresos) o derivar el resumen sin memo.',
    where: 'usePaymentBalancePageViewModel.ts:56',
  },
  'FIN-04': {
    cause:
      'Equilibrio agrupa el alquiler por `date || datePaid` (fecha del servicio) mientras el dashboard usa datePaid (fecha de pago).',
    fix: 'Usar datePaid en Equilibrio, como DashboardMetricsService.',
    where:
      'paymentBalanceSummary.ts:56-59 · DashboardMetricsService.ts:113 (referencia)',
  },
  'FIN-05': {
    cause:
      'El resumen de Equilibrio no resta egresos ni pagos de propina, que sí descuenta la tarjeta de Efectivo del dashboard.',
    fix: 'Restar egresos y pagos de propina por método en el resumen, reutilizando el cálculo que ya usa la tarjeta.',
    where: 'paymentBalanceSummary.ts:17-24',
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
  'FIN-10': {
    cause: 'El formulario solo valida que el monto no esté vacío (!amount).',
    fix: 'Rechazar montos menores o iguales a 0 (y no numéricos) antes de guardar, mostrando el error.',
    where: 'pages/ExpensesPage.tsx:118-121',
  },
  'FIN-11': {
    cause:
      'La lógica del formulario de equilibrio no valida el saldo disponible ni que la tasa sea mayor a 0 (con tasa 0 el cálculo da Infinity).',
    fix: 'Bloquear la transferencia si el monto supera el saldo del método de origen o si la tasa no es positiva.',
    where: 'paymentBalanceFormLogic.ts:55-79 (líneas 93 y 97 para la tasa)',
  },
  'FIN-12': {
    cause:
      'useDashboardData carga las ventas de todo el mes pero no los egresos; la tienda de egresos solo tiene los días ya visitados en Egresos.',
    fix: 'Cargar los egresos del mes completo en los mismos cargadores de rango del dashboard (relacionado con C4 y C6 del audit).',
    where:
      'useDashboardData.ts (cargadores por rango) · caché de la tienda de egresos',
  },
} as const satisfies Record<string, BugKnowledge>;

export type BugId = keyof typeof BUG_KNOWLEDGE;
