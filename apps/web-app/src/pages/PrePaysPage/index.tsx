/**
 * PrePaysPage/index.tsx
 * Orchestrator for the prepaid orders page.
 * Preserves the named export { PrePaysPage } used by Index.tsx.
 */
import { Button } from '@/components/ui/button';
import { Droplets, Plus } from 'lucide-react';
import { PrepaidStatusLabels } from '@/types';
import { PrepaidOrderCard } from './components/PrepaidOrderCard';
import { PrepaidFormSheet } from './components/PrepaidFormSheet';
import { usePrePaysPageViewModel } from './hooks/usePrePaysPageViewModel';

export function PrePaysPage() {
  const {
    filteredOrders,
    pendingCount,
    filterStatus,
    setFilterStatus,
    sheetOpen,
    setSheetOpen,
    editingOrder,
    customerName,
    setCustomerName,
    liters,
    setLiters,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    saving,
    isMarkingDelivered,
    isDeleting,
    deletingId,
    getPriceForLiters,
    handleOpenSheet,
    handleEdit,
    handleSubmit,
    handleMarkDelivered,
    handleDelete,
  } = usePrePaysPageViewModel();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === 'pendiente' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pendiente')}
            className="flex-1"
          >
            Pendientes ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'entregado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('entregado')}
            className="flex-1"
          >
            {PrepaidStatusLabels['entregado']}
          </Button>
          <Button
            variant={filterStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('todos')}
            className="flex-1"
          >
            Todos
          </Button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              No hay pedidos{' '}
              {filterStatus === 'pendiente'
                ? 'pendientes'
                : filterStatus === 'entregado'
                ? 'entregados'
                : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <PrepaidOrderCard
                key={order.id}
                order={order}
                isMarkingDelivered={isMarkingDelivered}
                isDeleting={isDeleting}
                deletingId={deletingId}
                onEdit={handleEdit}
                onMarkDelivered={handleMarkDelivered}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Button
        onClick={handleOpenSheet}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <PrepaidFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingOrder={editingOrder}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        liters={liters}
        onLitersChange={setLiters}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        notes={notes}
        onNotesChange={setNotes}
        saving={saving}
        onSubmit={handleSubmit}
        getPriceForLiters={getPriceForLiters}
      />
    </div>
  );
}
