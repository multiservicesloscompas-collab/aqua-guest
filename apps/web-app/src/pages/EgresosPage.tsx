import { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExpenseCategory, ExpenseCategoryLabels, Expense } from '@/types';
import { Plus, Trash2, Wallet, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function EgresosPage() {
  const {
    selectedDate,
    setSelectedDate,
    getExpensesByDate,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useAppStore();

  const [showSheet, setShowSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('operativo');
  const [notes, setNotes] = useState('');

  const expenses = getExpensesByDate(selectedDate);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleReset = () => {
    setDescription('');
    setAmount('');
    setCategory('operativo');
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
    setNotes(expense.notes || '');
    setShowSheet(true);
  };

  const handleSubmit = () => {
    if (!description || !amount) return;
    (async () => {
      try {
        if (editingExpense) {
          await updateExpense(editingExpense.id, {
            description,
            amount: Number(amount),
            category,
            notes: notes || undefined,
          });
          toast.success('Egreso actualizado');
        } else {
          await addExpense({
            date: selectedDate,
            description,
            amount: Number(amount),
            category,
            notes: notes || undefined,
          });
          toast.success('Egreso registrado');
        }
        handleReset();
        setShowSheet(false);
      } catch (err) {
        toast.error('Error guardando egreso');
      }
    })();
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    toast.success('Egreso eliminado');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Egresos" subtitle="Registro de gastos" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

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

        {/* Lista de egresos */}
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Sin egresos este día</p>
            <p className="text-xs">Presiona + para registrar un gasto</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-card rounded-xl p-4 border shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {expense.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ExpenseCategoryLabels[expense.category]}
                    </p>
                    {expense.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-destructive">
                      Bs {expense.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(expense)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar egreso?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(expense.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              disabled={!description || !amount}
              className="w-full h-14 text-base font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {editingExpense ? (
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
