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
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
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
            data-testid="customers-search-input"
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
            <Card className="border-dashed" data-testid="customers-empty-state">
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
              <Card
                key={customer.id}
                className="overflow-hidden"
                data-testid={`customer-row-${customer.id}`}
              >
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
                        data-testid={`customer-edit-${customer.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(customer.id)}
                        data-testid={`customer-delete-${customer.id}`}
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
        data-testid="customers-add-fab"
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
      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="¿Eliminar cliente?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
