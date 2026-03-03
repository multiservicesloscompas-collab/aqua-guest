import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useConfigStore } from '@/store/useConfigStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { PaymentBalanceTransaction, PaymentMethod } from '@/types';

export interface PaymentBalanceFormData {
  fromMethod: PaymentMethod | '';
  toMethod: PaymentMethod | '';
  amount: string;
  notes: string;
}

const DEFAULT_FORM_DATA: PaymentBalanceFormData = {
  fromMethod: '',
  toMethod: '',
  amount: '',
  notes: '',
};

export function usePaymentBalancePageViewModel() {
  const {
    paymentBalanceTransactions,
    addPaymentBalanceTransaction,
    updatePaymentBalanceTransaction,
    deletePaymentBalanceTransaction,
    getPaymentBalanceSummary,
  } = usePaymentBalanceStore();
  const { selectedDate, setSelectedDate } = useAppStore();
  const { config } = useConfigStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(
    null
  );
  const [formData, setFormData] =
    useState<PaymentBalanceFormData>(DEFAULT_FORM_DATA);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const balanceSummary = useMemo(() => {
    return getPaymentBalanceSummary(selectedDate);
  }, [selectedDate, getPaymentBalanceSummary, paymentBalanceTransactions]);

  const transactionsForDate = useMemo(() => {
    return paymentBalanceTransactions
      .filter((t) => t.date === selectedDate)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [paymentBalanceTransactions, selectedDate]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  const getValidationResult = useCallback(() => {
    if (!formData.fromMethod || !formData.toMethod || !formData.amount) {
      toast.error('Completa todos los campos requeridos');
      return null;
    }

    if (formData.fromMethod === formData.toMethod) {
      toast.error('Los métodos de pago origen y destino deben ser diferentes');
      return null;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo');
      return null;
    }

    const exchangeRate = config.exchangeRate;
    let amountBs = amount;
    let amountUsd = 0;

    if (formData.fromMethod === 'divisa' || formData.toMethod === 'divisa') {
      amountUsd = amount;
      amountBs = amount * exchangeRate;
    }

    return {
      amountBs,
      amountUsd: amountUsd || undefined,
      fromMethod: formData.fromMethod,
      toMethod: formData.toMethod,
      notes: formData.notes,
    } as const;
  }, [config.exchangeRate, formData]);

  const handleAddTransaction = useCallback(async () => {
    const payload = getValidationResult();
    if (!payload) return;

    setIsAdding(true);
    try {
      await addPaymentBalanceTransaction({
        date: selectedDate,
        amount: payload.amountBs,
        amountBs: payload.amountBs,
        amountUsd: payload.amountUsd,
        fromMethod: payload.fromMethod,
        toMethod: payload.toMethod,
        notes: payload.notes,
      });
      resetForm();
      setShowAddForm(false);
      toast.success('Transferencia registrada exitosamente');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('No se pudo registrar la transferencia. Intenta nuevamente.');
    } finally {
      setIsAdding(false);
    }
  }, [
    addPaymentBalanceTransaction,
    getValidationResult,
    resetForm,
    selectedDate,
  ]);

  const handleUpdateTransaction = useCallback(
    async (id: string) => {
      const payload = getValidationResult();
      if (!payload) return;

      setIsUpdating(true);
      try {
        await updatePaymentBalanceTransaction(id, {
          amount: payload.amountBs,
          amountBs: payload.amountBs,
          amountUsd: payload.amountUsd,
          fromMethod: payload.fromMethod,
          toMethod: payload.toMethod,
          notes: payload.notes,
        });
        resetForm();
        setEditingTransaction(null);
        toast.success('Transferencia actualizada exitosamente');
      } catch (error) {
        console.error('Error updating transaction:', error);
        toast.error(
          'No se pudo actualizar la transferencia. Intenta nuevamente.'
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [getValidationResult, resetForm, updatePaymentBalanceTransaction]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      if (
        !confirm('¿Está seguro de eliminar esta transacción de equilibrio?')
      ) {
        return;
      }

      setDeletingId(id);
      setIsDeleting(true);
      try {
        await deletePaymentBalanceTransaction(id);
        toast.success('Transferencia eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error(
          'No se pudo eliminar la transferencia. Intenta nuevamente.'
        );
      } finally {
        setIsDeleting(false);
        setDeletingId(null);
      }
    },
    [deletePaymentBalanceTransaction]
  );

  const startEdit = useCallback((transaction: PaymentBalanceTransaction) => {
    setEditingTransaction(transaction.id);

    let displayAmount = transaction.amount;
    if (transaction.amountUsd) {
      displayAmount = transaction.amountUsd;
    }

    setFormData({
      fromMethod: transaction.fromMethod,
      toMethod: transaction.toMethod,
      amount: displayAmount.toString(),
      notes: transaction.notes || '',
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingTransaction(null);
    resetForm();
  }, [resetForm]);

  const getMethodIcon = useCallback((method: PaymentMethod) => {
    switch (method) {
      case 'efectivo':
        return '💵';
      case 'pago_movil':
        return '📱';
      case 'punto_venta':
        return '💳';
      case 'divisa':
        return '💲';
      default:
        return '💰';
    }
  }, []);

  const getMethodColor = useCallback((method: PaymentMethod) => {
    switch (method) {
      case 'efectivo':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'pago_movil':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'punto_venta':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'divisa':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }, []);

  return {
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
  };
}
