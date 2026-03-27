import { Plus } from 'lucide-react';
import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletControlsCard } from '@/components/layout/TabletControlsCard';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { Button } from '@/components/ui/button';
import { DateSelector } from '@/components/ventas/DateSelector';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import {
  TABLET_PRIMARY_CONTROLS_FLOW_CLASS,
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { PaymentBalanceFormCard } from './components/PaymentBalanceFormCard';
import { PaymentBalanceSummaryCard } from './components/PaymentBalanceSummaryCard';
import { PaymentBalanceTransactionsCard } from './components/PaymentBalanceTransactionsCard';
import { usePaymentBalancePageViewModel } from './hooks/usePaymentBalancePageViewModel';

export function PaymentBalancePage() {
  const { isTabletViewport } = useViewportMode();
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
      <AppPageContainer>
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="payment-balance-primary-column"
              >
                <div className={TABLET_PRIMARY_CONTROLS_FLOW_CLASS}>
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

                  <TabletControlsCard title="Controles">
                    <Button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="w-full"
                      variant={showAddForm ? 'outline' : 'default'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showAddForm ? 'Cancelar' : 'Nueva Transferencia'}
                    </Button>

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
                  </TabletControlsCard>
                </div>

                <PaymentBalanceTransactionsCard
                  transactions={transactionsForDate}
                  isDeleting={isDeleting}
                  deletingId={deletingId}
                  editingTransaction={editingTransaction}
                  onEdit={startEdit}
                  onDelete={handleDeleteTransaction}
                  getMethodIcon={getMethodIcon}
                />
              </div>
            }
            secondary={
              <aside
                className={TABLET_SECONDARY_COMPLEMENTARY_CLASS}
                data-testid="payment-balance-secondary-column"
              />
            }
          />
        ) : (
          <>
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

            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full"
              variant={showAddForm ? 'outline' : 'default'}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showAddForm ? 'Cancelar' : 'Nueva Transferencia'}
            </Button>

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
          </>
        )}
      </AppPageContainer>
    </div>
  );
}
