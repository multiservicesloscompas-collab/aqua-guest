import {
  Droplets,
  Home,
  Settings,
  Truck,
  Users,
  WashingMachine,
  TrendingDown,
} from 'lucide-react';

import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { cn } from '@/lib/utils';
import type { AppRoute } from '@/types';
import { routeToModule } from '@/types/navigation';

interface TabletNavigationRailProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenMenu?: () => void;
}

interface SidebarItem {
  route: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** 7 first-class modules — flat list, no section separators */
const moduleItems: SidebarItem[] = [
  { route: 'dashboard', label: 'Inicio', icon: Home },
  { route: 'ventas', label: 'Agua', icon: Droplets },
  { route: 'alquiler', label: 'Lavadoras', icon: WashingMachine },
  { route: 'deliverys', label: 'Entregas', icon: Truck },
  { route: 'clientes', label: 'Clientes', icon: Users },
  { route: 'egresos', label: 'Finanzas', icon: TrendingDown },
  { route: 'config-tasa-cambio', label: 'Configuración', icon: Settings },
];

export function TabletNavigationRail({
  currentRoute,
  onNavigate,
}: TabletNavigationRailProps) {
  const { isTabletViewport, viewportMode } = useViewportMode();

  if (!isTabletViewport) {
    return null;
  }

  // Collapsed (icon-only) on tablet-portrait, expanded on landscape/desktop
  const collapsed = viewportMode === 'tablet-portrait';

  return (
    <aside
      data-testid="tablet-navigation-rail"
      data-viewport-mode={viewportMode}
      aria-label="Navegación principal"
      className={cn(
        'sticky top-0 z-30 hidden h-screen flex-col border-r border-border/60 bg-card md:flex',
        collapsed ? 'w-[4.5rem]' : 'w-60'
      )}
    >
      {/* Logo / App name area */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border/60',
          collapsed ? 'justify-center' : 'px-5 gap-3'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Droplets className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-foreground">
            AquaGest
          </span>
        )}
      </div>

      {/* Navigation items — 6 modules flat */}
      <nav
        className={cn(
          'flex flex-1 flex-col overflow-y-auto px-2 py-4 gap-1',
          collapsed && 'items-center'
        )}
        aria-label="Módulos"
      >
        {moduleItems.map(({ route, label, icon: Icon }) => {
          // For module-level items, highlight if current route belongs to the same module
          const currentModule = routeToModule[currentRoute];
          const itemModule = routeToModule[route] ?? route;
          const isActive =
            currentRoute === route ||
            (currentModule !== undefined && currentModule === itemModule);
          return (
            <button
              key={route}
              onClick={() => onNavigate(route)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center rounded-xl transition-all duration-150',
                collapsed ? 'h-11 justify-center px-0' : 'h-11 gap-3 px-3',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-foreground/40" />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform duration-150',
                  isActive
                    ? 'text-primary-foreground scale-110'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    isActive ? 'text-primary-foreground' : ''
                  )}
                >
                  {label}
                </span>
              )}
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border group-hover:block whitespace-nowrap">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
