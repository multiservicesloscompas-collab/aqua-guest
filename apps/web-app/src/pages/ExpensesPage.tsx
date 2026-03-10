import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useAppStore } from '@/store/useAppStore';
import { Expense, ExpenseCategory, PaymentMethod } from '@/types';

import { ExpenseSheetForm } from './ExpensesPage/components/ExpenseSheetForm';
import { ExpensesContent } from './ExpensesPage/components/ExpensesContent';
import { ExpensesDayTotalCard } from './ExpensesPage/components/ExpensesDayTotalCard';
import { ExpensesMobileHeaderControls } from './ExpensesPage/components/ExpensesMobileHeaderControls';
import { ExpensesTabletSidebar } from './ExpensesPage/components/ExpensesTabletSidebar';
import { Button } from '@/components/ui/button';
import {
  TABLET_PRIMARY_CONTROLS_FLOW_CLASS,
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { cn } from '@/lib/utils';

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
  const { selectedDate, setSelectedDate } = useAppStore();

  const [viewMode, setViewMode] = useState<ExpensesViewMode>('day');
  const [showSheet, setShowSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('operativo');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

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
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleReset = () => {
    setDescription('');
    setAmount('');
    setCategory('operativo');
    setPaymentMethod('efectivo');
    setNotes('');
    setEditingExpense(null);
  };

  const handleOpenNew = () => {
    handleReset();
    setShowSheet(true);
  };

  useEffect(() => {
    if (autoOpenAdd) handleOpenNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAdd]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setPaymentMethod(expense.paymentMethod || 'efectivo');
    setNotes(expense.notes || '');
    setShowSheet(true);
  };

  const handleSubmit = async () => {
    if (!description || !amount) return;
    setIsSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          description,
          amount: Number(amount),
          category,
          paymentMethod,
          notes: notes || undefined,
        });
        toast.success('Egreso actualizado');
      } else {
        await addExpense({
          date: selectedDate,
          description,
          amount: Number(amount),
          category,
          paymentMethod,
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
                  expenses={expenses}
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
              expenses={expenses}
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

      <Sheet
        open={showSheet}
        onOpenChange={(o) => {
          if (!o) handleReset();
          setShowSheet(o);
        }}
      >
        <SheetContent
          side="bottom"
          tabletSide="right"
          tabletClassName="sm:max-w-xl"
          className="h-auto rounded-t-2xl px-4 pb-8"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              {editingExpense ? (
                <>
                  <Pencil className="w-5 h-5 text-primary" />
                  Editar Egreso
                </>
              ) : (
                'Registrar Egreso'
              )}
            </SheetTitle>
          </SheetHeader>

          <ExpenseSheetForm
            description={description}
            amount={amount}
            category={category}
            paymentMethod={paymentMethod}
            notes={notes}
            editing={Boolean(editingExpense)}
            isSaving={isSaving}
            onDescriptionChange={setDescription}
            onAmountChange={setAmount}
            onCategoryChange={setCategory}
            onPaymentMethodChange={setPaymentMethod}
            onNotesChange={setNotes}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
