import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ExpenseCategory,
  ExpenseCategoryLabels,
  Expense,
  PaymentMethod,
  PaymentMethodLabels,
} from '@/types';
import {
  Plus,
  Wallet,
  Pencil,
  Loader2,
  CalendarDays,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ExpenseCard } from '@/components/egresos/ExpenseCard';
import { WeeklyExpensesView } from '@/components/egresos/WeeklyExpensesView';

type EgresosViewMode = 'day' | 'week';

export function EgresosPage() {
  const {
    selectedDate,
    setSelectedDate,
    getExpensesByDate,
    loadExpensesByDate,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<EgresosViewMode>('day');
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
      <Header title="Egresos" subtitle="Registro de gastos" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              loading={loadingExpenses}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleViewMode}
            className={cn(
              'h-12 w-12 shrink-0 rounded-xl border transition-colors',
              viewMode === 'week'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'text-muted-foreground'
            )}
            title={viewMode === 'day' ? 'Vista semanal' : 'Vista diaria'}
          >
            {viewMode === 'day' ? (
              <CalendarDays className="w-5 h-5" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
          </Button>
        </div>

        {viewMode === 'day' ? (
          <>
            {/* Total del día */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-destructive" />
                  <span className="text-sm font-medium text-foreground">
                    Total Egresos
                  </span>
                </div>
                <span className="text-xl font-extrabold text-destructive">
                  Bs {totalExpenses.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de egresos del día */}
            {loadingExpenses && expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 mb-3 animate-spin" />
                <p className="text-sm font-medium">Cargando egresos...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">Sin egresos este día</p>
                <p className="text-xs">Presiona + para registrar un gasto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <WeeklyExpensesView
            anchorDate={selectedDate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deletingId={deletingId}
          />
        )}
      </main>

      {/* FAB */}
      <Button
        onClick={handleOpenNew}
        className={cn(
          'fixed bottom-24 right-4 w-14 h-14 rounded-full bg-destructive text-destructive-foreground shadow-fab z-40',
          'transition-transform hover:scale-105 active:scale-95'
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Sheet para agregar/editar */}
      <Sheet
        open={showSheet}
        onOpenChange={(o) => {
          if (!o) handleReset();
          setShowSheet(o);
        }}
      >
        <SheetContent side="bottom" className="h-auto rounded-t-2xl px-4 pb-8">
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descripción</Label>
              <Input
                placeholder="Ej: Compra de insumos"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Monto (Bs)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Categoría</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ExpenseCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">
                    {PaymentMethodLabels.efectivo}
                  </SelectItem>
                  <SelectItem value="pago_movil">
                    {PaymentMethodLabels.pago_movil}
                  </SelectItem>
                  <SelectItem value="divisa">
                    {PaymentMethodLabels.divisa}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Notas (opcional)</Label>
              <Textarea
                placeholder="Detalles adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-16 resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!description || !amount || isSaving}
              className="w-full h-14 text-base font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editingExpense ? (
                <>
                  <Pencil className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Registrar Egreso
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
