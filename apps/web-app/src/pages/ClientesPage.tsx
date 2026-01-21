import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import {
  Search,
  User,
  Phone,
  MapPin,
  Trash2,
  UserPlus,
  Users,
  Pencil,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

export default function ClientesPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } =
    useAppStore();
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
    } catch (err) {
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
      } catch (err) {
        toast.error('Error eliminando cliente');
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Clientes" />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{customers.length} clientes registrados</span>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  {search
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleEdit(customer.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <Button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-10"
      >
        <UserPlus className="w-6 h-6" />
      </Button>

      {/* Add/Edit Customer Sheet */}
      <Sheet
        open={showAddSheet}
        onOpenChange={(open) => {
          if (!open) {
            handleReset();
          }
          setShowAddSheet(open);
        }}
      >
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {editingCustomer ? (
                <>
                  <Pencil className="w-5 h-5 text-primary" />
                  Editar Cliente
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-primary" />
                  Nuevo Cliente
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Nombre del cliente"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="Número de teléfono"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Dirección"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="h-12"
              />
            </div>
            <Button
              onClick={handleSaveCustomer}
              disabled={isSaving}
              className="w-full h-12 text-base font-semibold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSaving ? 'Guardando...' : editingCustomer ? (
                <>
                  <Pencil className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              ) : (
                'Guardar Cliente'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
