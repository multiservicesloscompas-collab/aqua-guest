import { Home, Droplets, WashingMachine, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { AppRoute } from '@/types';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenMenu: () => void;
}

const navItems: { route: AppRoute; label: string; icon: typeof Home }[] = [
  { route: 'dashboard', label: 'Inicio', icon: Home },
  { route: 'ventas', label: 'Agua', icon: Droplets },
  { route: 'alquiler', label: 'Lavadoras', icon: WashingMachine },
];

export function BottomNav({
  currentRoute,
  onNavigate,
  onOpenMenu,
}: BottomNavProps) {
  const { isTabletViewport } = useViewportMode();

  if (isTabletViewport) {
    return null;
  }

  // Check if current route belongs to the "Más" menu
  const isMenuActive = [
    'egresos',
    'clientes',
    'config',
    'seguimiento',
    'lavadoras',
    'equilibrio-pagos',
    'deliverys',
    'prepagados',
    'metricas-agua',
    'transacciones-hoy',
    'historial-tasas',
    'lavadoras-metricas',
    'entregas-metricas',
    'clientes-metricas',
    'clientes-top',
    'egresos-metricas',
    'config-precios-agua',
    'config-tasa-cambio',
  ].includes(currentRoute);

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ route, label, icon: Icon }) => {
          const isActive = currentRoute === route;
          return (
            <button
              key={route}
              onClick={() => onNavigate(route)}
              aria-label={`Ir a ${label}`}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-11 gap-0.5 touch-target transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                  isActive && 'bg-primary/10'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-all',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* Menu Button */}
        <button
          onClick={onOpenMenu}
          aria-label="Abrir más opciones"
          aria-pressed={isMenuActive}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-h-11 gap-0.5 touch-target transition-all duration-200',
            isMenuActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
              isMenuActive && 'bg-primary/10'
            )}
          >
            <MoreHorizontal
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isMenuActive && 'scale-110'
              )}
              strokeWidth={isMenuActive ? 2.5 : 2}
            />
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold transition-all',
              isMenuActive ? 'opacity-100' : 'opacity-70'
            )}
          >
            Más
          </span>
        </button>
      </div>
    </nav>
  );
}
