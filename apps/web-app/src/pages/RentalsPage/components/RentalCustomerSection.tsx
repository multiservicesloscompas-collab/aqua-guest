import { MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerSearch } from './CustomerSearch';
import { Customer } from '@/types';

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
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <User className="w-4 h-4" />
        Cliente
      </Label>

      <CustomerSearch
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(customer) =>
          onSelectCustomer(customer ? customer.id : null)
        }
        onCreateNew={onCreateNewCustomer}
        placeholder="Buscar cliente registrado..."
      />

      <div className="space-y-3">
        <Input
          placeholder="Nombre del cliente"
          value={customerName}
          onChange={(event) => onChangeCustomerName(event.target.value)}
          className="h-12"
        />
        <Input
          placeholder="Teléfono"
          type="tel"
          value={customerPhone}
          onChange={(event) => onChangeCustomerPhone(event.target.value)}
          className="h-12"
        />
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Dirección de entrega"
            value={customerAddress}
            onChange={(event) => onChangeCustomerAddress(event.target.value)}
            className="h-12 pl-10"
          />
        </div>
      </div>
    </div>
  );
}
