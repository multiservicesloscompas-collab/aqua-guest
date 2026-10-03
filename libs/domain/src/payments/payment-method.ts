export const PAYMENT_METHOD = {
  pago_movil: 'pago_movil',
  efectivo: 'efectivo',
  punto_venta: 'punto_venta',
  divisa: 'divisa',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHODS: ReadonlyArray<PaymentMethod> =
  Object.values(PAYMENT_METHOD);
