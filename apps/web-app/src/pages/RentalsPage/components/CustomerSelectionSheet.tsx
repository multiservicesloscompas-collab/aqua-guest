import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CustomerSearch } from './CustomerSearch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, User, Phone, Check, Eraser } from 'lucide-react';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface CustomerSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  selectedCustomerId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  onSelectCustomer: (customerId: string | null) => void;
  onCreateNewCustomer: () => void;
  onChangeCustomerName: (value: string) => void;
  onChangeCustomerPhone: (value: string) => void;
  onChangeCustomerAddress: (value: string) => void;
}

export function CustomerSelectionSheet({
  open,
  onOpenChange,
  customers,
  selectedCustomerId,
  customerName,
  customerPhone,
  customerAddress,
  onSelectCustomer,
  onCreateNewCustomer,
  onChangeCustomerName,
  onChangeCustomerPhone,
  onChangeCustomerAddress,
}: CustomerSelectionSheetProps) {
  const isSelected = !!selectedCustomerId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px]"
        className="h-[90vh] sm:h-full flex flex-col justify-between rounded-t-2xl px-4 pb-8 sm:rounded-none overflow-y-auto overscroll-contain touch-pan-y"
      >
        <div>
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Seleccionar Cliente
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {!isSelected && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Buscar cliente registrado</Label>
                <CustomerSearch
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={(customer) =>
                    onSelectCustomer(customer ? customer.id : null)
                  }
                  onCreateNew={onCreateNewCustomer}
                  placeholder="Buscar cliente..."
                />
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {isSelected ? 'Datos del cliente seleccionado' : 'O ingresa los datos (Nuevo cliente)'}
                </Label>
              </div>
              <div
                className={cn(
                  'space-y-3 p-4 rounded-xl border transition-colors',
                  isSelected ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-border'
                )}
              >
                <Input
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(event) => onChangeCustomerName(event.target.value)}
                  className={cn(
                    'h-12 bg-background',
                    isSelected && 'bg-background/50 text-foreground pointer-events-none'
                  )}
                  readOnly={isSelected}
                />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Teléfono (opcional)"
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => onChangeCustomerPhone(event.target.value)}
                    className={cn(
                      'h-12 pl-10 bg-background',
                      isSelected && 'bg-background/50 text-foreground pointer-events-none'
                    )}
                    readOnly={isSelected}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Dirección de entrega"
                    value={customerAddress}
                    onChange={(event) => onChangeCustomerAddress(event.target.value)}
                    className={cn(
                      'h-12 pl-10 bg-background',
                      isSelected && 'bg-background/50 text-foreground pointer-events-none'
                    )}
                    readOnly={isSelected}
                  />
                </div>

                {isSelected && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4 h-12 rounded-xl border-dashed border-primary/40 text-primary hover:text-primary hover:bg-primary/10 font-bold transition-colors"
                    onClick={() => {
                      onSelectCustomer(null);
                      onCreateNewCustomer();
                    }}
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Limpiar selección y crear nuevo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-auto">
          <Button
            className="w-full h-12 text-base font-bold rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={!customerName.trim() && !isSelected}
          >
            <Check className="w-5 h-5 mr-2" />
            Aplicar y Continuar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
