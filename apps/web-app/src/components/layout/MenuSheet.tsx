import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletViewport ? 'right' : 'bottom'}
        tabletSide="right"
        tabletClassName={cn(
          'h-full rounded-none border-l px-5 py-5',
          isTabletLandscape ? 'sm:max-w-[28rem]' : 'sm:max-w-[26rem]'
        )}
        className={cn(!isTabletViewport && 'h-auto max-h-[80vh] rounded-t-3xl')}
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Más opciones</SheetTitle>
        </SheetHeader>

        <div
          className={cn(
            'space-y-2 overflow-y-auto pb-6',
            isTabletViewport ? 'max-h-[calc(100vh-7rem)]' : 'max-h-[60vh]'
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
                    <span className="text-sm text-muted-foreground">
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
      </SheetContent>
    </Sheet>
  );
}
