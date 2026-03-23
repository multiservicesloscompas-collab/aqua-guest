import { useEffect, useState } from 'react';

import type { Expense, ExpenseCategory, PaymentMethod } from '@/types';
import { resolveSplitFormHydrationState } from '@/services/payments/paymentSplitFormHydration';

const PAYMENT_METHOD_PRIORITY: PaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

function getAlternativeMethod(current: PaymentMethod): PaymentMethod {
  return (
    PAYMENT_METHOD_PRIORITY.find((method) => method !== current) ?? 'efectivo'
  );
}

interface UseExpenseSheetStateInput {
  autoOpenAdd?: boolean;
}

export function useExpenseSheetState({
  autoOpenAdd,
}: UseExpenseSheetStateInput) {
  const [showSheet, setShowSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('operativo');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');

  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [secondaryMethod, setSecondaryMethod] =
    useState<PaymentMethod>('pago_movil');
  const [mixedAmountInput, setMixedAmountInput] = useState('');

  useEffect(() => {
    if (!isMixedPayment || secondaryMethod !== paymentMethod) {
      return;
    }

    setSecondaryMethod(getAlternativeMethod(paymentMethod));
  }, [isMixedPayment, paymentMethod, secondaryMethod]);

  const handleReset = () => {
    setDescription('');
    setAmount('');
    setCategory('operativo');
    setPaymentMethod('efectivo');
    setNotes('');
    setIsMixedPayment(false);
    setSecondaryMethod('pago_movil');
    setMixedAmountInput('');
    setEditingExpense(null);
  };

  const handleOpenNew = () => {
    handleReset();
    setShowSheet(true);
  };

  useEffect(() => {
    if (autoOpenAdd) {
      handleOpenNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAdd]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setNotes(expense.notes || '');

    const hydration = resolveSplitFormHydrationState({
      paymentMethod: expense.paymentMethod || 'efectivo',
      paymentSplits: expense.paymentSplits,
      totalBs: expense.amount,
    });

    setPaymentMethod(hydration.paymentMethod);
    setIsMixedPayment(hydration.isMixedPayment);
    setSecondaryMethod(hydration.split2Method);
    setMixedAmountInput(hydration.split1Amount);
    setShowSheet(true);
  };

  return {
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
  };
}
