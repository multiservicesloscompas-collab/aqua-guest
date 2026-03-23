import { useState } from 'react';
import { UserPlus, User, Phone, MapPin } from 'lucide-react';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { CustomerSelectionSheet } from './CustomerSelectionSheet';

interface RentalCustomerSectionProps {
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

export function RentalCustomerSection({
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
}: RentalCustomerSectionProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const hasCustomerData = !!(selectedCustomerId || customerName.trim());
  const displayPhone = customerPhone || 'Sin teléfono';
  const displayAddress = customerAddress || 'Sin dirección';

  return (
    <div className="space-y-3">
      {!hasCustomerData ? (
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-[24px] transition-all duration-300',
            'bg-card border border-border hover:border-primary/50 shadow-sm active:scale-[0.98]'
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 bg-primary/10 text-primary">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[16px] font-bold text-foreground">Cliente</span>
              <span className="text-[13px] font-medium text-muted-foreground truncate">
                Agregar o buscar cliente
              </span>
            </div>
          </div>
          
          <div className="px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap bg-primary/10 text-primary transition-colors">
            Agregar
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-[24px] transition-all duration-300 text-left',
            'bg-card border border-border shadow-sm active:scale-[0.98] ring-1 ring-primary/20'
          )}
        >
          <div className="flex items-start gap-4 w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 bg-primary/10 text-primary mt-0.5">
              <User className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start min-w-0 w-full gap-1">
              <div className="flex items-center justify-between w-full">
                <span className="text-[16px] font-bold text-foreground truncate max-w-[85%]">
                  {customerName || 'Cliente sin nombre'}
                </span>
                <span className="text-[12px] font-bold text-primary shrink-0 ml-2">
                  Editar
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground w-full">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{displayPhone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground w-full">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="truncate leading-tight max-w-[95%]">{displayAddress}</span>
              </div>
            </div>
          </div>
        </button>
      )}

      <CustomerSelectionSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        onSelectCustomer={onSelectCustomer}
        onCreateNewCustomer={onCreateNewCustomer}
        onChangeCustomerName={onChangeCustomerName}
        onChangeCustomerPhone={onChangeCustomerPhone}
        onChangeCustomerAddress={onChangeCustomerAddress}
      />
    </div>
  );
}
