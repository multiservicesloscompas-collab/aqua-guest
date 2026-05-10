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
  // TODO: do not use snake_case!
  pago_movil: 'Pago Móvil',
  // TODO: do not use snake_case!
  efectivo: 'Efectivo',
  // TODO: do not use snake_case!
  punto_venta: 'Punto de Venta',
  // TODO: do not use snake_case!
  divisa: 'Divisa',
};

// Registro de venta completo
export type { Sale };

// Registro de egreso/gasto
export type { Expense, ExpenseCategory };

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  operativo: 'Operativo',
  insumos: 'Insumos',
  servicios: 'Servicios',
  mantenimiento: 'Mantenimiento',
  personal: 'Personal',
  otros: 'Otros',
};

// ============================================
// ALQUILER DE LAVADORAS
// ============================================

// Estado de la lavadora
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

// Lavadora disponible
export type { WashingMachine };

// Tipo de jornada
export type { RentalShift };

export const RentalShiftConfig: Record<
  RentalShift,
  { label: string; priceUsd: number; hours: number }
> = {
  medio: { label: 'Medio Turno', priceUsd: 4, hours: 8 },
  completo: { label: 'Completo', priceUsd: 6, hours: 24 },
  doble: { label: 'Doble', priceUsd: 12, hours: 48 },
};

// Estado del alquiler
export type { RentalStatus };

export const RentalStatusLabels: Record<RentalStatus, string> = {
  agendado: 'Agendado',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
};

// Cliente para autocompletado
export type { Customer };

// Registro de alquiler
export type { WasherRental };

// Extensión de alquiler
export type { RentalExtension };

// Horario comercial
export const BUSINESS_HOURS = {
  openHour: 9, // 9 AM
  closeHour: 20, // 8 PM (20:00) Lunes-Sábado
  sundayCloseHour: 14, // 2 PM (14:00) Domingo
  workDays: [0, 1, 2, 3, 4, 5, 6], // Domingo a Sábado
};

// ============================================
// CONFIGURACIÓN Y ESTADÍSTICAS
// ============================================

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

// Configuración global
export interface AppConfig {
  exchangeRate: number; // Tasa Bs/USD
  lastUpdated: string;
  literPricing: LiterPricing[]; // Precios por litros
  exchangeRateHistory: ExchangeRateHistory[]; // Historial de tasas
}

// ============================================
// AGUA PREPAGADA
// ============================================

export type { PrepaidOrder, PrepaidStatus };

export const PrepaidStatusLabels: Record<PrepaidStatus, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
};

export const PrepaidStatusColors: Record<PrepaidStatus, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  entregado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

// ============================================
// EQUILIBRIO DE TIPOS DE PAGO
// ============================================

// Transacción de equilibrio entre métodos de pago
export type {
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
};

// Resumen de equilibrio por método de pago
export type { PaymentBalanceSummary };
// Navegación — tipos centralizados en navigation.ts
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
