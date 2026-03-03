import { Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { DateSelector } from '@/components/ventas/DateSelector';
import { PaymentBalanceFormCard } from './components/PaymentBalanceFormCard';
import { PaymentBalanceSummaryCard } from './components/PaymentBalanceSummaryCard';
import { PaymentBalanceTransactionsCard } from './components/PaymentBalanceTransactionsCard';
import { usePaymentBalancePageViewModel } from './hooks/usePaymentBalancePageViewModel';

export function PaymentBalancePage() {
  const {
    selectedDate,
    setSelectedDate,
    config,
    showAddForm,
    setShowAddForm,
    editingTransaction,
    formData,
    setFormData,
    isAdding,
    isUpdating,
    isDeleting,
    deletingId,
    balanceSummary,
    transactionsForDate,
    handleAddTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    startEdit,
    cancelEdit,
    getMethodIcon,
    getMethodColor,
  } = usePaymentBalancePageViewModel();

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="Equilibrio de Pagos"
        subtitle="Transferencia entre métodos de pago"
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de fecha */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <PaymentBalanceSummaryCard
          summaries={balanceSummary}
          selectedDate={selectedDate}
          exchangeRate={config.exchangeRate}
          getMethodIcon={getMethodIcon}
          getMethodColor={getMethodColor}
        />

        {/* Botón para agregar transacción */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full"
          variant={showAddForm ? 'outline' : 'default'}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showAddForm ? 'Cancelar' : 'Nueva Transferencia'}
        </Button>

        {/* Formulario para agregar/editar transacción */}
        {(showAddForm || editingTransaction) && (
          <PaymentBalanceFormCard
            formData={formData}
            editingTransaction={editingTransaction}
            exchangeRate={config.exchangeRate}
            isAdding={isAdding}
            isUpdating={isUpdating}
            onFormDataChange={setFormData}
            onAdd={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            onCancelEdit={cancelEdit}
            getMethodIcon={getMethodIcon}
          />
        )}

        <PaymentBalanceTransactionsCard
          transactions={transactionsForDate}
          isDeleting={isDeleting}
          deletingId={deletingId}
          editingTransaction={editingTransaction}
          onEdit={startEdit}
          onDelete={handleDeleteTransaction}
          getMethodIcon={getMethodIcon}
        />
      </main>
    </div>
  );
}
