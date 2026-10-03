export const PAYMENT_METHOD = {
  efectivo: 'efectivo',
  pago_movil: 'pago_movil',
  punto_venta: 'punto_venta',
  divisa: 'divisa',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHODS: ReadonlyArray<PaymentMethod> =
  Object.values(PAYMENT_METHOD);
