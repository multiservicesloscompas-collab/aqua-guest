import { RefObject, useEffect, useMemo, useState } from 'react';
import { Customer } from '@/types';

interface CustomerSearchViewModelProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateNew: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function useCustomerSearchViewModel({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onCreateNew,
  searchTerm,
  setSearchTerm,
  inputRef,
}: CustomerSearchViewModelProps) {
  const [open, setOpen] = useState(false);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const term = searchTerm.toLowerCase().trim();
    return customers.filter((customer) => {
      const nameMatch = (customer.name || '').toLowerCase().includes(term);
      const phoneMatch = (customer.phone || '').toLowerCase().includes(term);
      const addressMatch = (customer.address || '')
        .toLowerCase()
        .includes(term);
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open, inputRef]);

  return {
    open,
    setOpen,
    selectedCustomer,
    filteredCustomers,
    handleSelect,
    handleClear,
    handleKeyDown,
  };
}
