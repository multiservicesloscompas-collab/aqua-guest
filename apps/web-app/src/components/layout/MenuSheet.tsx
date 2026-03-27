import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { ChevronRight, X } from 'lucide-react';
import { AppRoute } from '@/types';
import { cn } from '@/lib/utils';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { secondaryNavigationItems } from './navigationItems';

interface MenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function MenuSheet({
  open,
  onOpenChange,
  currentRoute,
  onNavigate,
}: MenuSheetProps) {
  const { viewportMode, isTabletViewport } = useViewportMode();
  const isTabletLandscape = viewportMode === 'tablet-landscape';

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          'flex flex-col',
          isTabletViewport 
            ? cn(
                'h-full rounded-none border-l w-full right-0 left-auto top-0',
                isTabletLandscape ? 'sm:max-w-[28rem]' : 'sm:max-w-[26rem]'
              )
            : 'h-auto max-h-[85vh] rounded-t-3xl'
        )}
      >
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DrawerClose>

        <DrawerHeader className="pb-4 shrink-0">
          <DrawerTitle className="text-lg">Más opciones</DrawerTitle>
        </DrawerHeader>

        <div
          className={cn(
            'space-y-2 overflow-y-auto px-4 pb-8',
            isTabletViewport ? 'flex-1' : 'max-h-[60vh]'
          )}
        >
          {secondaryNavigationItems.map(
            ({ route, label, description, icon: Icon }) => {
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
                  <div className="flex-1">
                    <span
                      className={cn(
                        'font-medium block',
                        isActive && 'text-primary'
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {description}
                    </span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </button>
              );
            }
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
