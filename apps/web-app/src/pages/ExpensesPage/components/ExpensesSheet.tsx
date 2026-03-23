import { Pencil } from 'lucide-react';

import { Expense } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ExpenseSheetForm } from './ExpenseSheetForm';

interface ExpensesSheetProps {
  open: boolean;
  editingExpense: Expense | null;
  description: string;
  amount: string;
  category: Expense['category'];
  paymentMethod: Expense['paymentMethod'];
  notes: string;
  isSaving: boolean;
  isMixedPayment: boolean;
  secondaryMethod: Expense['paymentMethod'];
  mixedAmountInput: string;
  enableMixedPaymentFeature: boolean;
  onOpenChange: (open: boolean) => void;
  onIsMixedPaymentChange: (value: boolean) => void;
  onSecondaryMethodChange: (value: Expense['paymentMethod']) => void;
  onMixedAmountInputChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: Expense['category']) => void;
  onPaymentMethodChange: (value: Expense['paymentMethod']) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
}

export function ExpensesSheet({
  open,
  editingExpense,
  description,
  amount,
  category,
  paymentMethod,
  notes,
  isSaving,
  isMixedPayment,
  secondaryMethod,
  mixedAmountInput,
  enableMixedPaymentFeature,
  onOpenChange,
  onIsMixedPaymentChange,
  onSecondaryMethodChange,
  onMixedAmountInputChange,
  onDescriptionChange,
  onAmountChange,
  onCategoryChange,
  onPaymentMethodChange,
  onNotesChange,
  onSubmit,
}: ExpensesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-xl sm:h-full sm:max-h-screen sm:rounded-none"
        className="h-auto max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-2xl px-4 pb-8"
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
          isMixedPayment={isMixedPayment}
          secondaryMethod={secondaryMethod}
          mixedAmountInput={mixedAmountInput}
          enableMixedPaymentFeature={enableMixedPaymentFeature}
          onIsMixedPaymentChange={onIsMixedPaymentChange}
          onSecondaryMethodChange={onSecondaryMethodChange}
          onMixedAmountInputChange={onMixedAmountInputChange}
          onDescriptionChange={onDescriptionChange}
          onAmountChange={onAmountChange}
          onCategoryChange={onCategoryChange}
          onPaymentMethodChange={onPaymentMethodChange}
          onNotesChange={onNotesChange}
          onSubmit={onSubmit}
        />
      </SheetContent>
    </Sheet>
  );
}
