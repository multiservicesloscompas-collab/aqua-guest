import {
  ClipboardList,
  Droplets,
  Home,
  Settings,
  TrendingDown,
  Truck,
  Users,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react';

import type { AppRoute } from '@/types';

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
    route: 'seguimiento',
    label: 'Seguimiento',
    description: 'Alquileres pendientes y enviados',
    icon: ClipboardList,
  },
  {
    route: 'deliverys',
    label: 'Entregas',
    description: 'Historial de entregas de lavadoras',
    icon: Truck,
  },
  {
    route: 'lavadoras',
    label: 'Lavadoras',
    description: 'Gestiona tus lavadoras',
    icon: WashingMachine,
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
    route: 'prepagados',
    label: 'Prepagados',
    description: 'Pedidos pagados por adelantado',
    icon: ClipboardList,
  },
  {
    route: 'metricas-agua',
    label: 'Métricas de agua',
    description: 'Resumen y tendencias de ventas de agua',
    icon: Droplets,
  },
  {
    route: 'transacciones-hoy',
    label: 'Transacciones',
    description: 'Movimientos diarios por módulo',
    icon: TrendingDown,
  },
  {
    route: 'equilibrio-pagos',
    label: 'Equilibrio de pagos',
    description: 'Transferencias entre métodos de pago',
    icon: Settings,
  },
  {
    route: 'config',
    label: 'Configuración',
    description: 'Tasa de cambio y ajustes',
    icon: Settings,
  },
];
