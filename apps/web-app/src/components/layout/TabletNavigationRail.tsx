import {
  ClipboardList,
  Droplets,
  Home,
  Settings,
  Scale,
  Truck,
  Users,
  WashingMachine,
  TrendingDown,
} from 'lucide-react';

import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { cn } from '@/lib/utils';
import type { AppRoute } from '@/types';

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

const mainItems: SidebarItem[] = [
  { route: 'dashboard', label: 'Inicio', icon: Home },
  { route: 'ventas', label: 'Ventas', icon: Droplets },
  { route: 'alquiler', label: 'Alquiler', icon: WashingMachine },
];

const operationsItems: SidebarItem[] = [
  { route: 'seguimiento', label: 'Seguimiento', icon: ClipboardList },
  { route: 'deliverys', label: 'Entregas', icon: Truck },
  { route: 'prepagados', label: 'Prepagados', icon: ClipboardList },
];

const financeItems: SidebarItem[] = [
  { route: 'egresos', label: 'Egresos', icon: TrendingDown },
  { route: 'equilibrio-pagos', label: 'Equilibrio', icon: Scale },
  { route: 'clientes', label: 'Clientes', icon: Users },
];

const settingsItems: SidebarItem[] = [
  { route: 'config', label: 'Configuración', icon: Settings },
];

interface SidebarSectionProps {
  items: SidebarItem[];
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  collapsed: boolean;
  label?: string;
}

function SidebarSection({
  items,
  currentRoute,
  onNavigate,
  collapsed,
  label,
}: SidebarSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      {!collapsed && label && (
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
      )}
      {items.map(({ route, label: itemLabel, icon: Icon }) => {
        const isActive = currentRoute === route;
        return (
          <button
            key={route}
            onClick={() => onNavigate(route)}
            aria-label={itemLabel}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex w-full items-center rounded-xl transition-all duration-150',
              collapsed ? 'h-11 justify-center px-0' : 'h-11 gap-3 px-3',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {/* Active indicator bar */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-foreground/40" />
            )}
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-transform duration-150',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground',
                isActive && 'scale-110'
              )}
            />
            {!collapsed && (
              <span
                className={cn(
                  'truncate text-sm font-medium',
                  isActive ? 'text-primary-foreground' : ''
                )}
              >
                {itemLabel}
              </span>
            )}
            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border group-hover:block whitespace-nowrap">
                {itemLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

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

      {/* Navigation items */}
      <nav
        className={cn(
          'flex flex-1 flex-col overflow-y-auto px-2 py-4',
          collapsed ? 'justify-center gap-4' : 'justify-between'
        )}
      >
        <div className="flex flex-col gap-4">
          <SidebarSection
            items={mainItems}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            collapsed={collapsed}
            label="Principal"
          />

          <div className="mx-2 h-px bg-border/60" />

          <SidebarSection
            items={operationsItems}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            collapsed={collapsed}
            label="Operaciones"
          />

          <div className="mx-2 h-px bg-border/60" />

          <SidebarSection
            items={financeItems}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            collapsed={collapsed}
            label="Finanzas"
          />
        </div>

        {/* Settings pinned at bottom (or centered with icon stack on collapsed tablet) */}
        <div className={cn(!collapsed && 'pt-4')}>
          <div className="mx-2 h-px bg-border/60 mb-4" />
          <SidebarSection
            items={settingsItems}
            currentRoute={currentRoute}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        </div>
      </nav>
    </aside>
  );
}
