import type {
  CartItem,
  Customer,
  ExchangeRateHistory,
  Expense,
  ExpenseCategory,
  LiterPricing,
  MachineStatus,
  PaymentBalanceSummary,
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
  PaymentMethod,
  PrepaidOrder,
  PrepaidStatus,
  Product as DomainProduct,
  RentalExtension,
  RentalShift,
  RentalShiftConfig,
  RentalStatus,
  Sale,
  WasherRental,
  WashingMachine,
} from '@aqua-guest/domain';

export type Product = DomainProduct;

type ProductVisualFields = {
  icon: string;
};

export type ProductWithIcon = Product & Partial<ProductVisualFields>;

export type { CartItem };

export type { PaymentMethod };

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  pago_movil: 'Pago Móvil',
  efectivo: 'Efectivo',
  punto_venta: 'Punto de Venta',
  divisa: 'Divisa',
};

export type { Sale };

export type { Expense, ExpenseCategory };

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  operativo: 'Operativo',
  insumos: 'Insumos',
  servicios: 'Servicios',
  mantenimiento: 'Mantenimiento',
  personal: 'Personal',
  otros: 'Otros',
};

export type { MachineStatus };

export const MachineStatusLabels: Record<MachineStatus, string> = {
  disponible: 'Disponible',
  mantenimiento: 'En Mantenimiento',
  averiada: 'Averiada',
};

export const MachineStatusColors: Record<MachineStatus, string> = {
  disponible: 'bg-green-500/10 text-green-600 border-green-500/20',
  mantenimiento: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  averiada: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export type { WashingMachine };

export type { RentalShift, RentalShiftConfig };

export const RentalShiftConfigMap: Record<
  string,
  { label: string; priceUsd: number; hours: number }
> = {
  medio: { label: 'Medio Turno', priceUsd: 4, hours: 8 },
  completo: { label: 'Completo', priceUsd: 6, hours: 24 },
  doble: { label: 'Doble', priceUsd: 12, hours: 48 },
};

export type { RentalStatus };

export const RentalStatusLabels: Record<RentalStatus, string> = {
  agendado: 'Agendado',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
};

export type { Customer };

export type { WasherRental };

export type { RentalExtension };

export const BUSINESS_HOURS = {
  openHour: 9,
  closeHour: 20,
  sundayCloseHour: 14,
  workDays: [0, 1, 2, 3, 4, 5, 6],
};

export type { LiterPricing };

export const DEFAULT_LITER_BREAKPOINTS: LiterPricing[] = [
  { breakpoint: 2, price: 40.0 },
  { breakpoint: 5, price: 60.0 },
  { breakpoint: 8, price: 150.0 },
  { breakpoint: 12, price: 101.0 },
  { breakpoint: 15, price: 200.0 },
  { breakpoint: 19, price: 240.0 },
  { breakpoint: 24, price: 300.0 },
];

export type { ExchangeRateHistory };

export interface AppConfig {
  exchangeRate: number;
  lastUpdated: string;
  literPricing: LiterPricing[];
  exchangeRateHistory: ExchangeRateHistory[];
}

export type { PrepaidOrder, PrepaidStatus };

export const PrepaidStatusLabels: Record<PrepaidStatus, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
};

export const PrepaidStatusColors: Record<PrepaidStatus, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  entregado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export type {
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
};

export type { PaymentBalanceSummary };
export type { AppRoute, ModuleRoute, ModuleSubItem } from './navigation';
export { routeToModule } from './navigation';
export type {
  Tip,
  TipOriginType,
  TipPayout,
  TipPayoutSummary,
  TipStatus,
} from './tips';
export type { DashboardStats, ChartDataPoint } from './analytics';
