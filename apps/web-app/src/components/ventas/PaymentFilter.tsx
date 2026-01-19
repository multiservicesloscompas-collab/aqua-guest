import { useState } from 'react';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Banknote, 
  Smartphone, 
  CreditCard, 
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PaymentFilterProps {
  selectedFilter: PaymentMethod | 'todos';
  onFilterChange: (filter: PaymentMethod | 'todos') => void;
}

const paymentIcons: Record<PaymentMethod, any> = {
  efectivo: Banknote,
  pago_movil: Smartphone,
  punto_venta: CreditCard,
  divisa: DollarSign,
};

export function PaymentFilter({ selectedFilter, onFilterChange }: PaymentFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filters: Array<{ value: PaymentMethod | 'todos'; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'punto_venta', label: 'Punto de Venta' },
    { value: 'pago_movil', label: 'Pago Móvil' },
    { value: 'divisa', label: 'Divisa' },
  ];

  const getFilterLabel = () => {
    const filter = filters.find(f => f.value === selectedFilter);
    return filter ? filter.label : 'Todos';
  };

  const getFilterIcon = () => {
    if (selectedFilter === 'todos') return Filter;
    return paymentIcons[selectedFilter as PaymentMethod] || Filter;
  };

  const FilterIcon = getFilterIcon();

  return (
    <div className="space-y-3">
      {/* Botón principal para mostrar/ocultar filtros */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full justify-between h-12 px-4 bg-card border-border hover:bg-muted/50 transition-all duration-200',
          'shadow-sm hover:shadow-md'
        )}
      >
        <div className="flex items-center gap-3">
          <FilterIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {getFilterLabel()}
          </span>
          {selectedFilter !== 'todos' && (
            <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">
              Activo
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
        )}
      </Button>

      {/* Panel de filtros desplegable */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Seleccionar método de pago</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.value;
              const isPaymentMethod = filter.value !== 'todos';
              const Icon = isPaymentMethod ? paymentIcons[filter.value as PaymentMethod] : null;
              
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onFilterChange(filter.value);
                    setIsExpanded(false); // Auto-cerrar después de seleccionar
                  }}
                  className={cn(
                    'gap-2 transition-all duration-200 h-10',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm border-primary' 
                      : 'hover:bg-muted/50 hover:border-primary/50'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span className="text-xs font-medium">{filter.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
