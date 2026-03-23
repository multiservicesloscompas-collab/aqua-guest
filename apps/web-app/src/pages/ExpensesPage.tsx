import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useTipStore } from '@/store/useTipStore';
import { useAppStore } from '@/store/useAppStore';
import { useConfigStore } from '@/store/useConfigStore';
import { ExpensesContent } from './ExpensesPage/components/ExpensesContent';
import { ExpensesDayTotalCard } from './ExpensesPage/components/ExpensesDayTotalCard';
import { ExpensesMobileHeaderControls } from './ExpensesPage/components/ExpensesMobileHeaderControls';
import { ExpensesSheet } from './ExpensesPage/components/ExpensesSheet';
import { ExpensesTabletSidebar } from './ExpensesPage/components/ExpensesTabletSidebar';
import { Button } from '@/components/ui/button';
import {
  TABLET_PRIMARY_CONTROLS_FLOW_CLASS,
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { cn } from '@/lib/utils';
import { mergeExpensesWithTipPayouts } from '@/services/expenses/expensesWithTipPayouts';
import { isMixedPaymentEnabledForModule } from '@/services/payments/paymentSplitFeatureFlag';
import { useExpenseSheetState } from './ExpensesPage/hooks/useExpenseSheetState';
import { resolveExpensePaymentSubmit } from './ExpensesPage/utils/expensePaymentSubmit';

type ExpensesViewMode = 'day' | 'week';

interface ExpensesPageProps {
  autoOpenAdd?: boolean;
}

export function ExpensesPage({ autoOpenAdd }: ExpensesPageProps = {}) {
  const { isTabletViewport } = useViewportMode();
  const {
    getExpensesByDate,
    loadExpensesByDate,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenseStore();
  const { tipPayouts, loadTipsByDateRange } = useTipStore();
  const { selectedDate, setSelectedDate } = useAppStore();
  const { config, mixedPaymentFlags } = useConfigStore();

  const [viewMode, setViewMode] = useState<ExpensesViewMode>('day');
  const {
    showSheet,
    setShowSheet,
    editingExpense,
    description,
    amount,
    category,
    paymentMethod,
    notes,
    isMixedPayment,
    secondaryMethod,
    mixedAmountInput,
    setDescription,
    setAmount,
    setCategory,
    setPaymentMethod,
    setNotes,
    setIsMixedPayment,
    setSecondaryMethod,
    setMixedAmountInput,
    handleReset,
    handleOpenNew,
    handleEdit,
  } = useExpenseSheetState({ autoOpenAdd });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const enableMixedPaymentFeature = isMixedPaymentEnabledForModule(
    mixedPaymentFlags,
    'expenses'
  );

  useEffect(() => {
    if (!selectedDate || viewMode !== 'day') return;
    const cachedExpenses = getExpensesByDate(selectedDate);
    if (cachedExpenses.length > 0) {
      return;
    }
    setLoadingExpenses(true);
    loadExpensesByDate(selectedDate)
      .catch((err: unknown) => {
        console.error('Error loading expenses for date:', selectedDate, err);
      })
      .finally(() => {
        setLoadingExpenses(false);
      });
  }, [selectedDate, loadExpensesByDate, getExpensesByDate, viewMode]);

  const expenses = getExpensesByDate(selectedDate);
  const visibleExpenses = useMemo(
    () =>
      mergeExpensesWithTipPayouts({
        date: selectedDate,
        expenses,
        tipPayouts,
      }),
    [selectedDate, expenses, tipPayouts]
  );
  const totalExpenses = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    void loadTipsByDateRange(selectedDate, selectedDate);
  }, [loadTipsByDateRange, selectedDate]);

  const handleSubmit = async () => {
    if (!description || !amount) return;
    setIsSaving(true);
    try {
      const parsedAmount = Number(amount);
      const paymentResolution = resolveExpensePaymentSubmit({
        enableMixedPaymentFeature,
        isMixedPayment,
        paymentMethod,
        secondaryMethod,
        mixedAmountInput,
        parsedAmount,
        exchangeRate: config.exchangeRate || 1,
      });

      if (paymentResolution.errorMessage) {
        toast.error(paymentResolution.errorMessage);
        return;
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          description,
          amount: parsedAmount,
          category,
          paymentMethod: paymentResolution.paymentMethod,
          paymentSplits: paymentResolution.paymentSplits,
          notes: notes || undefined,
        });
        toast.success('Egreso actualizado');
      } else {
        await addExpense({
          date: selectedDate,
          description,
          amount: parsedAmount,
          category,
          paymentMethod: paymentResolution.paymentMethod,
          paymentSplits: paymentResolution.paymentSplits,
          notes: notes || undefined,
        });
        toast.success('Egreso registrado');
      }
      handleReset();
      setShowSheet(false);
    } catch {
      toast.error('Error guardando egreso');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setIsDeleting(true);
    try {
      await deleteExpense(id);
      toast.success('Egreso eliminado');
    } catch {
      toast.error('Error eliminando egreso');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'day' ? 'week' : 'day'));
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <AppPageContainer>
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="expenses-primary-column"
              >
                <ExpensesTabletSidebar
                  className={TABLET_PRIMARY_CONTROLS_FLOW_CLASS}
                  dataTestId="expenses-controls-card"
                  selectedDate={selectedDate}
                  loadingExpenses={loadingExpenses}
                  viewMode={viewMode}
                  totalExpenses={totalExpenses}
                  onDateChange={setSelectedDate}
                  onToggleViewMode={toggleViewMode}
                  onOpenNewExpense={handleOpenNew}
                />
                <ExpensesContent
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  expenses={visibleExpenses}
                  loadingExpenses={loadingExpenses}
                  isDeleting={isDeleting}
                  deletingId={deletingId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            }
            secondary={
              <div
                className={TABLET_SECONDARY_COMPLEMENTARY_CLASS}
                data-testid="expenses-secondary-column"
              />
            }
          />
        ) : (
          <>
            <ExpensesMobileHeaderControls
              selectedDate={selectedDate}
              loadingExpenses={loadingExpenses}
              viewMode={viewMode}
              onDateChange={setSelectedDate}
              onToggleViewMode={toggleViewMode}
            />
            {viewMode === 'day' ? (
              <ExpensesDayTotalCard totalExpenses={totalExpenses} />
            ) : null}
            <ExpensesContent
              viewMode={viewMode}
              selectedDate={selectedDate}
              expenses={visibleExpenses}
              loadingExpenses={loadingExpenses}
              isDeleting={isDeleting}
              deletingId={deletingId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </AppPageContainer>

      {!isTabletViewport && (
        <Button
          onClick={handleOpenNew}
          className={cn(
            'fixed bottom-24 right-4 w-14 h-14 rounded-full bg-destructive text-destructive-foreground shadow-fab z-40',
            'transition-transform hover:scale-105 active:scale-95'
          )}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <ExpensesSheet
        open={showSheet}
        onOpenChange={(o) => {
          if (!o) handleReset();
          setShowSheet(o);
        }}
        editingExpense={editingExpense}
        description={description}
        amount={amount}
        category={category}
        paymentMethod={paymentMethod}
        notes={notes}
        isSaving={isSaving}
        isMixedPayment={isMixedPayment}
        secondaryMethod={secondaryMethod}
        mixedAmountInput={mixedAmountInput}
        enableMixedPaymentFeature={enableMixedPaymentFeature}
        onIsMixedPaymentChange={setIsMixedPayment}
        onSecondaryMethodChange={setSecondaryMethod}
        onMixedAmountInputChange={setMixedAmountInput}
        onDescriptionChange={setDescription}
        onAmountChange={setAmount}
        onCategoryChange={setCategory}
        onPaymentMethodChange={setPaymentMethod}
        onNotesChange={setNotes}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
