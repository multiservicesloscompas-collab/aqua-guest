/**
 * CustomersPage/index.tsx
 * Orchestrator for the customers page.
 * Preserves the default export used by Index.tsx.
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { useCustomersPageViewModel } from './hooks/useCustomersPageViewModel';

export default function CustomersPage() {
  const {
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
  } = useCustomersPageViewModel();

  return (
    <div className="min-h-screen bg-background pb-24">
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

      <CustomerFormSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        editingCustomer={editingCustomer}
        newName={newName}
        onNameChange={setNewName}
        newPhone={newPhone}
        onPhoneChange={setNewPhone}
        newAddress={newAddress}
        onAddressChange={setNewAddress}
        isSaving={isSaving}
        onSave={handleSaveCustomer}
        onReset={handleReset}
      />

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
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
