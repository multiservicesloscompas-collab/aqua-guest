import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types';
import {
  User,
  Phone,
  MapPin,
  Search,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSearchProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateNew: () => void;
  placeholder?: string;
  disabled?: boolean;
}

interface HighlightedTextProps {
  text: string;
  searchTerm: string;
}

function HighlightedText({ text, searchTerm }: HighlightedTextProps) {
  if (!searchTerm || !text) return <span>{text}</span>;

  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);

  if (index === -1) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5">
        {text.slice(index, index + searchTerm.length)}
      </mark>
      {text.slice(index + searchTerm.length)}
    </span>
  );
}

export function CustomerSearch({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onCreateNew,
  placeholder = 'Buscar cliente...',
  disabled = false,
}: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const term = searchTerm.toLowerCase().trim();
    return customers.filter((customer) => {
      const nameMatch = (customer.name || '').toLowerCase().includes(term);
      const phoneMatch = (customer.phone || '').toLowerCase().includes(term);
      const addressMatch = (customer.address || '').toLowerCase().includes(term);
      return nameMatch || phoneMatch || addressMatch;
    });
  }, [customers, searchTerm]);

  const handleSelect = (customerId: string) => {
    if (customerId === 'new') {
      onCreateNew();
      setOpen(false);
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      onSelectCustomer(customer);
      setSearchTerm('');
      setOpen(false);
    }
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full h-12 justify-between text-left font-normal',
              !selectedCustomer && 'text-muted-foreground'
            )}
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <User className="w-4 h-4 shrink-0 text-primary" />
                <span className="truncate">{selectedCustomer.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>{placeholder}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {selectedCustomer && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      handleClear();
                    }
                  }}
                  className="p-1 hover:bg-muted rounded-sm cursor-pointer"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </span>
              )}
              <span className="text-muted-foreground">▼</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command className="w-full" onKeyDown={handleKeyDown}>
            <CommandInput
              ref={inputRef}
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-4 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Search className="w-8 h-8 opacity-50" />
                  <p className="text-sm">No se encontraron clientes</p>
                  <p className="text-xs">
                    Intenta con otro término o crea uno nuevo
                  </p>
                </div>
              </CommandEmpty>

              <CommandGroup heading="Acciones">
                <CommandItem
                  value="new"
                  onSelect={() => handleSelect('new')}
                  className="cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2 text-primary" />
                  <span>Crear nuevo cliente</span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Clientes registrados">
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.name} ${customer.phone || ''} ${customer.address || ''} ${customer.id}`}
                    onSelect={() => handleSelect(customer.id)}
                    className="cursor-pointer py-3"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        {selectedCustomerId === customer.id ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium text-sm">
                          <HighlightedText
                            text={customer.name}
                            searchTerm={searchTerm}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                <HighlightedText
                                  text={customer.phone}
                                  searchTerm={searchTerm}
                                />
                              </span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                <HighlightedText
                                  text={customer.address}
                                  searchTerm={searchTerm}
                                />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="mt-2 p-3 bg-accent/50 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{selectedCustomer.name}</span>
          </div>
          {selectedCustomer.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{selectedCustomer.phone}</span>
            </div>
          )}
          {selectedCustomer.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{selectedCustomer.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
