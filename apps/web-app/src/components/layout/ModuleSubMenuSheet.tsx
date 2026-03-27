import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { ChevronRight, X } from 'lucide-react';
import type { AppRoute, ModuleRoute } from '@/types';
import { cn } from '@/lib/utils';
import { moduleSubItems } from './navigationItems';

const moduleTitles: Record<ModuleRoute, string> = {
  agua: 'Agua',
  lavadoras: 'Lavadoras',
  entregas: 'Entregas',
  clientes: 'Clientes',
  finanzas: 'Finanzas',
  configuracion: 'Configuración',
  dashboard: 'Dashboard',
};

interface ModuleSubMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleRoute: ModuleRoute;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function ModuleSubMenuSheet({
  open,
  onOpenChange,
  moduleRoute,
  currentRoute,
  onNavigate,
}: ModuleSubMenuSheetProps) {
  const items = moduleSubItems[moduleRoute] ?? [];
  const title = moduleTitles[moduleRoute];

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    onOpenChange(false);
  };

  if (items.length === 0) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-auto max-h-[75vh] rounded-t-3xl flex flex-col">
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DrawerClose>

        <DrawerHeader className="pb-4 shrink-0">
          <DrawerTitle className="text-lg">{title}</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-8 flex-1">
          {items.map(({ route, label, icon: Icon }) => {
            const isActive = currentRoute === route;
            return (
              <button
                key={route}
                onClick={() => handleNavigate(route)}
                aria-label={`Ir a ${label}`}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-accent/50 hover:bg-accent'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    'flex-1 font-medium',
                    isActive && 'text-primary'
                  )}
                >
                  {label}
                </span>
                <ChevronRight
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
