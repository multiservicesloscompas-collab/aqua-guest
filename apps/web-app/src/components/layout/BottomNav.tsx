import { Home, Droplets, WashingMachine, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppRoute } from '@/types';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenMenu: () => void;
}

const navItems: { route: AppRoute; label: string; icon: typeof Home }[] = [
  { route: 'dashboard', label: 'Inicio', icon: Home },
  { route: 'ventas', label: 'Ventas', icon: Droplets },
  { route: 'alquiler', label: 'Alquiler', icon: WashingMachine },
];

export function BottomNav({
  currentRoute,
  onNavigate,
  onOpenMenu,
}: BottomNavProps) {
  // Check if current route is a secondary menu item
  const isMenuActive = [
    'clientes',
    'egresos',
    'config',
    'seguimiento',
    'lavadoras',
    'equilibrio-pagos',
  ].includes(currentRoute);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ route, label, icon: Icon }) => {
          const isActive = currentRoute === route;
          return (
            <button
              key={route}
              onClick={() => onNavigate(route)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 touch-target transition-all duration-200',
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
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-0.5 touch-target transition-all duration-200',
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
