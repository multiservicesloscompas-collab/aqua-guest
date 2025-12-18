import { Product } from '@/types';

export const defaultProducts: Product[] = [
  {
    id: 'recarga-agua',
    name: 'Recarga de Agua',
    defaultPrice: 5.00,
    requiresLiters: true,
    minLiters: 1,
    maxLiters: 24,
    icon: '💧',
  },
  {
    id: 'botellon-nuevo',
    name: 'Botellón Nuevo',
    defaultPrice: 25.00,
    requiresLiters: false,
    icon: '🫗',
  },
  {
    id: 'tapa-botellon',
    name: 'Tapa de Botellón',
    defaultPrice: 2.50,
    requiresLiters: false,
    icon: '🔵',
  },
  {
    id: 'dispensador',
    name: 'Dispensador',
    defaultPrice: 15.00,
    requiresLiters: false,
    icon: '🚰',
  },
  {
    id: 'botella-600ml',
    name: 'Botella 600ml',
    defaultPrice: 3.00,
    requiresLiters: false,
    icon: '🍶',
  },
  {
    id: 'hielo-bolsa',
    name: 'Bolsa de Hielo',
    defaultPrice: 8.00,
    requiresLiters: false,
    icon: '🧊',
  },
];
