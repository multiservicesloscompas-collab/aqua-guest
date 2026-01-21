import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Users, TrendingDown, Settings, WashingMachine, ChevronRight, ClipboardList, Droplets, Truck, ArrowLeftRight } from 'lucide-react';
import { AppRoute } from '@/types';
import { cn } from '@/lib/utils';

interface MenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const menuItems: { route: AppRoute; label: string; description: string; icon: typeof Users }[] = [
  //{ 
    //route: 'equilibrio-pagos', 
    //label: 'Equilibrar Pagos', 
    //description: 'Transferir entre métodos de pago',
    //icon: ArrowLeftRight 
  //},
  //{
    //route: 'prepagados', 
    //label: 'Agua Prepagada', 
    //description: 'Pedidos pagados por adelantado',
    //icon: Droplets 
  //},
  { 
    route: 'seguimiento', 
    label: 'Seguimiento', 
    description: 'Alquileres pendientes y enviados',
    icon: ClipboardList 
  },
  { 
    route: 'deliverys', 
    label: 'Entregas', 
    description: 'Historial de entregas de lavadoras',
    icon: Truck 
  },
  { 
    route: 'lavadoras', 
    label: 'Lavadoras', 
    description: 'Gestiona tus lavadoras',
    icon: WashingMachine 
  },
  { 
    route: 'clientes', 
    label: 'Clientes', 
    description: 'Gestiona tu base de clientes',
    icon: Users 
  },
  { 
    route: 'egresos', 
    label: 'Egresos', 
    description: 'Registra gastos operativos',
    icon: TrendingDown 
  },
  { 
    route: 'config', 
    label: 'Configuración', 
    description: 'Tasa de cambio y ajustes',
    icon: Settings 
  },
];

export function MenuSheet({ open, onOpenChange, currentRoute, onNavigate }: MenuSheetProps) {
  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[80vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Más opciones</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 pb-6 overflow-y-auto max-h-[60vh] -webkit-overflow-scrolling: touch">
          {menuItems.map(({ route, label, description, icon: Icon }) => {
            const isActive = currentRoute === route;
            return (
              <button
                key={route}
                onClick={() => handleNavigate(route)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left',
                  isActive 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-accent/50 hover:bg-accent'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-background'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className={cn(
                    'font-medium block',
                    isActive && 'text-primary'
                  )}>
                    {label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
                <ChevronRight className={cn(
                  'w-5 h-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
