/**
 * usePrePaysPageViewModel.ts
 * State and logic for the PrePaysPage.
 */
import { useState } from 'react';
import { usePrepaidStore } from '@/store/usePrepaidStore';
import { useConfigStore } from '@/store/useConfigStore';
import { PaymentMethod, PrepaidStatus } from '@/types';
import { toast } from 'sonner';

export function usePrePaysPageViewModel() {
  const {
    prepaidOrders,
    addPrepaidOrder,
    updatePrepaidOrder,
    deletePrepaidOrder,
    markPrepaidAsDelivered,
  } = usePrepaidStore();
  const { config, getPriceForLiters } = useConfigStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PrepaidStatus | 'todos'>(
    'pendiente'
  );

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [liters, setLiters] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setCustomerName('');
    setLiters('');
    setPaymentMethod('pago_movil');
    setNotes('');
    setEditingOrder(null);
  };

  const handleOpenSheet = () => {
    resetForm();
    setSheetOpen(true);
  };

  const handleEdit = (orderId: string) => {
    const order = prepaidOrders.find((o) => o.id === orderId);
    if (order) {
      setCustomerName(order.customerName);
      setLiters(order.liters.toString());
      setPaymentMethod(order.paymentMethod);
      setNotes(order.notes || '');
      setEditingOrder(orderId);
      setSheetOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !liters) return;

    const litersNum = Number(liters);
    const amountBs = getPriceForLiters(litersNum);
    const amountUsd = amountBs / config.exchangeRate;

    setSaving(true);
    try {
      if (editingOrder) {
        await updatePrepaidOrder(editingOrder, {
          customerName: customerName.trim(),
          liters: litersNum,
          amountBs,
          amountUsd,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
        toast.success('Prepago actualizado');
      } else {
        await addPrepaidOrder({
          customerName: customerName.trim(),
          liters: litersNum,
          amountBs,
          amountUsd,
          exchangeRate: config.exchangeRate,
          paymentMethod,
          status: 'pendiente',
          datePaid: new Date().toISOString().split('T')[0],
          notes: notes.trim() || undefined,
        });
        toast.success('Prepago registrado');
      }
      setSheetOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error guardando el prepago';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setIsMarkingDelivered(true);
    try {
      await markPrepaidAsDelivered(orderId);
      toast.success('Pedido marcado como entregado');
    } catch {
      toast.error('Error al marcar pedido como entregado');
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    setDeletingId(orderId);
    setIsDeleting(true);
    try {
      await deletePrepaidOrder(orderId);
      toast.success('Pedido eliminado');
    } catch {
      toast.error('Error al eliminar pedido');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredOrders = prepaidOrders.filter((order) =>
    filterStatus === 'todos' ? true : order.status === filterStatus
  );

  const pendingCount = prepaidOrders.filter(
    (o) => o.status === 'pendiente'
  ).length;

  return {
    prepaidOrders,
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
  };
}
