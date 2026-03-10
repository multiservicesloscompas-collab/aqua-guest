import {
  BarChart2,
  ClipboardList,
  CreditCard,
  DollarSign,
  Droplets,
  History,
  Home,
  Scale,
  Settings,
  TrendingDown,
  Trophy,
  Truck,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';

import type { AppRoute, ModuleRoute, ModuleSubItem } from '@/types';

export interface NavigationItem {
  route: AppRoute;
  label: string;
  icon: LucideIcon;
}

export interface SecondaryNavigationItem extends NavigationItem {
  description: string;
}

export const primaryNavigationItems: NavigationItem[] = [
  { route: 'dashboard', label: 'Inicio', icon: Home },
  { route: 'ventas', label: 'Ventas', icon: Droplets },
  { route: 'alquiler', label: 'Alquiler', icon: WashingMachine },
];

export const secondaryNavigationItems: SecondaryNavigationItem[] = [
  {
    route: 'deliverys',
    label: 'Entregas',
    description: 'Historial de entregas de lavadoras',
    icon: Truck,
  },
  {
    route: 'clientes',
    label: 'Clientes',
    description: 'Gestiona tu base de clientes',
    icon: Users,
  },
  {
    route: 'egresos',
    label: 'Egresos',
    description: 'Registra gastos operativos',
    icon: TrendingDown,
  },
  {
    route: 'transacciones-hoy',
    label: 'Transacciones',
    description: 'Movimientos diarios por módulo',
    icon: TrendingDown,
  },
];

export const moduleSubItems: Record<ModuleRoute, ModuleSubItem[]> = {
  agua: [
    { label: 'Métricas de Agua', route: 'metricas-agua', icon: BarChart2 },
    { label: 'Agua Prepagada', route: 'prepagados', icon: CreditCard },
    { label: 'Precios', route: 'config-precios-agua', icon: Settings },
  ],
  lavadoras: [
    {
      label: 'Métricas Lavadoras',
      route: 'lavadoras-metricas',
      icon: BarChart2,
    },
    { label: 'Seguimiento', route: 'seguimiento', icon: ClipboardList },
    { label: 'Gestión de Máquinas', route: 'lavadoras', icon: WashingMachine },
  ],
  entregas: [
    {
      label: 'Métricas Entregas',
      route: 'entregas-metricas',
      icon: BarChart2,
    },
  ],
  clientes: [
    {
      label: 'Métricas Clientes',
      route: 'clientes-metricas',
      icon: BarChart2,
    },
    { label: 'Top Clientes', route: 'clientes-top', icon: Trophy },
  ],
  finanzas: [
    { label: 'Métricas Egresos', route: 'egresos-metricas', icon: BarChart2 },
    {
      label: 'Equilibrio de Pagos',
      route: 'equilibrio-pagos',
      icon: Scale,
    },
  ],
  configuracion: [
    { label: 'Tasa de Cambio', route: 'config-tasa-cambio', icon: DollarSign },
    { label: 'Historial de Tasas', route: 'historial-tasas', icon: History },
  ],
  dashboard: [],
};
