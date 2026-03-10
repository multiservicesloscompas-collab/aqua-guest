import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto pb-8">
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
      </SheetContent>
    </Sheet>
  );
}
