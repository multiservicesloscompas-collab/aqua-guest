import type { LucideIcon } from 'lucide-react';

// ============================================
// RUTAS DE NAVEGACIÓN
// ============================================

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
  | 'equilibrio-pagos'
  | 'transacciones-hoy'
  | 'detalle-pago'
  | 'lavadoras-metricas'
  | 'entregas-metricas'
  | 'clientes-metricas'
  | 'clientes-top'
  | 'egresos-metricas'
  | 'config-precios-agua'
  | 'config-tasa-cambio';

export type ModuleRoute =
  | 'agua'
  | 'lavadoras'
  | 'entregas'
  | 'clientes'
  | 'finanzas'
  | 'configuracion'
  | 'dashboard';

export interface ModuleSubItem {
  label: string;
  route: AppRoute;
  icon: LucideIcon;
  description?: string;
}

// Lookup map: AppRoute → ModuleRoute (para derivar activeModuleRoute)
export const routeToModule: Partial<Record<AppRoute, ModuleRoute>> = {
  ventas: 'agua',
  'metricas-agua': 'agua',
  prepagados: 'agua',
  'config-precios-agua': 'agua',
  alquiler: 'lavadoras',
  'lavadoras-metricas': 'lavadoras',
  lavadoras: 'lavadoras',
  seguimiento: 'lavadoras',
  deliverys: 'entregas',
  'entregas-metricas': 'entregas',
  clientes: 'clientes',
  'clientes-metricas': 'clientes',
  'clientes-top': 'clientes',
  egresos: 'finanzas',
  'egresos-metricas': 'finanzas',
  'equilibrio-pagos': 'finanzas',
  'config-tasa-cambio': 'configuracion',
  'historial-tasas': 'configuracion',
  dashboard: 'dashboard',
  'transacciones-hoy': 'dashboard',
  'detalle-pago': 'dashboard',
};
