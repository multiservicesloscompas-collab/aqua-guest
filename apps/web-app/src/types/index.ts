// ============================================
// TIPOS DE DATOS - PWA Gestión Comercial Agua
// ============================================

// Producto disponible para venta
export interface Product {
  id: string;
  name: string;
  defaultPrice: number; // Precio en Bolívares
  requiresLiters: boolean; // Si requiere campo de litros
  minLiters?: number;
  maxLiters?: number;
  icon?: string;
}

// Item dentro de un carrito/venta
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  liters?: number; // Solo si el producto lo requiere
  unitPrice: number; // Precio por unidad en Bs
  subtotal: number; // quantity * unitPrice
}

// Método de pago
export type PaymentMethod = 'pago_movil' | 'efectivo' | 'punto_venta';

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  pago_movil: 'Pago Móvil',
  efectivo: 'Efectivo',
  punto_venta: 'Punto de Venta',
};

// Registro de venta completo
export interface Sale {
  id: string;
  dailyNumber: number; // ID incremental del día
  date: string; // ISO date string
  items: CartItem[];
  paymentMethod: PaymentMethod;
  totalBs: number;
  totalUsd: number;
  exchangeRate: number; // Tasa al momento de la venta
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Registro de egreso/gasto
export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number; // En Bolívares
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'operativo'
  | 'insumos'
  | 'servicios'
  | 'mantenimiento'
  | 'personal'
  | 'otros';

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
export type MachineStatus = 'disponible' | 'mantenimiento' | 'averiada';

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
export interface WashingMachine {
  id: string;
  name: string;
  kg: number; // Capacidad en kg
  brand: string; // Marca
  status: MachineStatus;
  isAvailable: boolean; // Deprecated, usar status === 'disponible'
}

// Tipo de jornada
export type RentalShift = 'medio' | 'completo' | 'doble';

export const RentalShiftConfig: Record<
  RentalShift,
  { label: string; priceUsd: number; hours: number }
> = {
  medio: { label: 'Medio Turno', priceUsd: 4, hours: 8 },
  completo: { label: 'Completo', priceUsd: 6, hours: 24 },
  doble: { label: 'Doble', priceUsd: 12, hours: 48 },
};

// Estado del alquiler
export type RentalStatus = 'agendado' | 'enviado' | 'finalizado';

export const RentalStatusLabels: Record<RentalStatus, string> = {
  agendado: 'Agendado',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
};

// Cliente para autocompletado
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

// Registro de alquiler
export interface WasherRental {
  id: string;
  date: string; // Fecha del servicio
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  machineId: string; // ID de lavadora
  shift: RentalShift;
  deliveryTime: string; // HH:mm
  pickupTime: string; // HH:mm calculado automáticamente
  pickupDate: string; // Puede ser el mismo día o el siguiente
  deliveryFee: number; // $0 - $5
  totalUsd: number; // Precio jornada + delivery
  paymentMethod: PaymentMethod; // Método de pago
  status: RentalStatus;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

// Precios por litros (breakpoints)
export interface LiterPricing {
  breakpoint: number; // Litros del breakpoint
  price: number; // Precio en Bs
}

export const DEFAULT_LITER_BREAKPOINTS: LiterPricing[] = [
  { breakpoint: 2, price: 40.0 },
  { breakpoint: 5, price: 60.0 },
  { breakpoint: 8, price: 150.0 },
  { breakpoint: 12, price: 101.0 },
  { breakpoint: 15, price: 200.0 },
  { breakpoint: 19, price: 240.0 },
  { breakpoint: 24, price: 300.0 },
];

// Historial de tasas de cambio
export interface ExchangeRateHistory {
  date: string; // YYYY-MM-DD
  rate: number;
  updatedAt: string;
}

// Configuración global
export interface AppConfig {
  exchangeRate: number; // Tasa Bs/USD
  lastUpdated: string;
  literPricing: LiterPricing[]; // Precios por litros
  exchangeRateHistory: ExchangeRateHistory[]; // Historial de tasas
}

// Estadísticas del Dashboard
export interface DashboardStats {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalSalesYear: number;
  totalExpensesToday: number;
  totalExpensesMonth: number;
  salesCount: number;
  averageTicket: number;
}

// Para gráficas
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

// ============================================
// AGUA PREPAGADA
// ============================================

export type PrepaidStatus = 'pendiente' | 'entregado';

export const PrepaidStatusLabels: Record<PrepaidStatus, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
};

export const PrepaidStatusColors: Record<PrepaidStatus, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  entregado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export interface PrepaidOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  liters: number;
  amountBs: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: PrepaidStatus;
  datePaid: string; // Fecha de pago
  dateDelivered?: string; // Fecha de entrega
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// EQUILIBRIO DE TIPOS DE PAGO
// ============================================

// Transacción de equilibrio entre métodos de pago
export interface PaymentBalanceTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  fromMethod: PaymentMethod; // Método de pago origen
  toMethod: PaymentMethod; // Método de pago destino
  amount: number; // Monto en Bolívares
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Resumen de equilibrio por método de pago
export interface PaymentBalanceSummary {
  method: PaymentMethod;
  originalTotal: number; // Total de transacciones reales
  adjustments: number; // Ajustes netos (+/-)
  finalTotal: number; // Total después de ajustes
}

// Navegación
export type AppRoute =
  | 'dashboard'
  | 'ventas'
  | 'alquiler'
  | 'egresos'
  | 'clientes'
  | 'lavadoras'
  | 'config'
  | 'seguimiento'
  | 'historial-tasas'
  | 'prepagados'
  | 'deliverys'
  | 'metricas-agua'
  | 'equilibrio-pagos';
