/**
 * useCustomersPageViewModel.ts
 * State and logic for the CustomersPage.
 */
import { useState } from 'react';
import { useCustomerStore } from '@/store/useCustomerStore';
import { toast } from 'sonner';

export function useCustomersPageViewModel() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } =
    useCustomerStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleReset = () => {
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setEditingCustomer(null);
  };

  const handleEdit = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setEditingCustomer(customerId);
      setNewName(customer.name);
      setNewPhone(customer.phone || '');
      setNewAddress(customer.address || '');
      setShowAddSheet(true);
    }
  };

  const handleSaveCustomer = async () => {
    if (!newName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setIsSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer, {
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
        });
        toast.success('Cliente actualizado');
      } else {
        await addCustomer({
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
        });
        toast.success('Cliente agregado');
      }
      setShowAddSheet(false);
      handleReset();
    } catch {
      toast.error(
        editingCustomer
          ? 'Error actualizando cliente'
          : 'Error agregando cliente'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      try {
        await deleteCustomer(deleteId);
        toast.success('Cliente eliminado');
      } catch {
        toast.error('Error eliminando cliente');
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  return {
    customers,
    filteredCustomers,
    search,
    setSearch,
    deleteId,
    setDeleteId,
    showAddSheet,
    setShowAddSheet,
    editingCustomer,
    newName,
    setNewName,
    newPhone,
    setNewPhone,
    newAddress,
    setNewAddress,
    isSaving,
    isDeleting,
    handleReset,
    handleEdit,
    handleSaveCustomer,
    handleDelete,
  };
}
