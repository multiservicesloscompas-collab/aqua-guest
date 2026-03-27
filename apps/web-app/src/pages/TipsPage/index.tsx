import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DateSelector } from '@/components/ventas/DateSelector';
import { useAppStore } from '@/store/useAppStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useTipStore } from '@/store/useTipStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { normalizeToVenezuelaDate } from '@/services/DateService';
import type { PaymentMethod } from '@/types';

import { TipCard } from './components/TipCard';
import { TipDaySummaryCard } from './components/TipDaySummaryCard';
import { TipPaymentMethodDrawer } from './components/TipPaymentMethodDrawer';
import { resolveTipOriginLabel } from './utils';

type PayingTipAction =
  | { type: 'single'; tipId: string }
  | { type: 'all' }
  | null;

export function TipsPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const { tips, loadTipsByDateRange, updateTipNote, paySingleTip } =
    useTipStore();
  const sales = useWaterSalesStore((state) => state.sales);
  const loadSalesByDate = useWaterSalesStore((state) => state.loadSalesByDate);
  const rentals = useRentalStore((state) => state.rentals);
  const loadRentalsByDate = useRentalStore((state) => state.loadRentalsByDate);

  const [editingTipId, setEditingTipId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // Drawer state mapping
  const [payingTipAction, setPayingTipAction] = useState<PayingTipAction>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadTipsByDateRange(selectedDate, selectedDate);
    loadSalesByDate(selectedDate).catch(() => undefined);
    loadRentalsByDate(selectedDate).catch(() => undefined);
  }, [loadTipsByDateRange, loadSalesByDate, loadRentalsByDate, selectedDate]);

  const salesById = useMemo(
    () =>
      new Map(
        sales.map((sale) => [sale.id, { dailyNumber: sale.dailyNumber }])
      ),
    [sales]
  );

  const rentalsById = useMemo(
    () =>
      new Map(
        rentals.map((rental) => [
          rental.id,
          { customerName: rental.customerName },
        ])
      ),
    [rentals]
  );

  const tipsForDay = useMemo(
    () =>
      tips.filter(
        (tip) => normalizeToVenezuelaDate(tip.tipDate) === selectedDate
      ),
    [tips, selectedDate]
  );

  const totalTipsBs = useMemo(
    () => tipsForDay.reduce((sum, tip) => sum + Number(tip.amountBs || 0), 0),
    [tipsForDay]
  );

  const pendingTipsCount = useMemo(
    () => tipsForDay.filter((tip) => tip.status === 'pending').length,
    [tipsForDay]
  );

  const paidTipsCount = useMemo(
    () => tipsForDay.filter((tip) => tip.status === 'paid').length,
    [tipsForDay]
  );

  const startEditing = (tipId: string, currentNote?: string) => {
    setEditingTipId(tipId);
    setNoteDraft(currentNote ?? '');
  };

  const cancelEditing = () => {
    setEditingTipId(null);
    setNoteDraft('');
  };

  const saveNote = async () => {
    if (!editingTipId) {
      return;
    }

    setSavingNote(true);
    try {
      await updateTipNote(editingTipId, noteDraft);
      toast.success('Nota de propina actualizada');
      cancelEditing();
    } catch {
      toast.error('No se pudo actualizar la nota de la propina');
    } finally {
      setSavingNote(false);
    }
  };

  // Open the drawer for a single tip
  const handlePayTipClick = (tipId: string) => {
    setPayingTipAction({ type: 'single', tipId });
  };

  // Open the drawer for all tips
  const handlePayAllTipsClick = () => {
    setPayingTipAction({ type: 'all' });
  };

  // Execute payment using the selected method
  const handleConfirmPayment = async (paymentMethod: PaymentMethod) => {
    if (!payingTipAction) return;

    setIsProcessingPayment(true);

    try {
      if (payingTipAction.type === 'single') {
        const tipId = payingTipAction.tipId;
        const tip = tipsForDay.find((item) => item.id === tipId);
        if (!tip || tip.status === 'paid') return;

        await paySingleTip({
          tipId,
          tipDate: selectedDate,
          paymentMethod,
        });
        toast.success('Propina pagada correctamente');
      } else if (payingTipAction.type === 'all') {
        const pendingTips = tipsForDay.filter((tip) => tip.status === 'pending');
        if (pendingTips.length === 0) return;

        await Promise.all(
          pendingTips.map((tip) =>
            paySingleTip({
              tipId: tip.id,
              tipDate: selectedDate,
              paymentMethod,
            })
          )
        );
        toast.success('Se pagaron todas las propinas del día');
      }
      setPayingTipAction(null);
    } catch {
      toast.error('Ocurrió un error al procesar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const hasPendingTips = pendingTipsCount > 0;
  
  // Drawer configuration based on the current action
  const drawerTitle =
    payingTipAction?.type === 'all'
      ? 'Pagar Todas las Propinas'
      : 'Pagar Propina';
  const drawerDescription =
    payingTipAction?.type === 'all'
      ? 'Selecciona la forma de pago para todas las propinas pendientes de este día.'
      : 'Selecciona la forma de pago mediante la cual entregarás esta propina.';

  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <TipDaySummaryCard
        selectedDate={selectedDate}
        totalTipsBs={totalTipsBs}
        totalTipsCount={tipsForDay.length}
        pendingTipsCount={pendingTipsCount}
        paidTipsCount={paidTipsCount}
        hasPendingTips={hasPendingTips}
        payingAll={isProcessingPayment && payingTipAction?.type === 'all'}
        onPayAllTips={handlePayAllTipsClick}
      />

      {tipsForDay.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          No hay propinas registradas para esta fecha.
        </div>
      ) : (
        <div className="space-y-3">
          {tipsForDay.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              originLabel={resolveTipOriginLabel(
                tip.originType,
                tip.originId,
                salesById,
                rentalsById
              )}
              isEditing={editingTipId === tip.id}
              noteDraft={noteDraft}
              savingNote={savingNote}
              isPaying={isProcessingPayment && payingTipAction?.type === 'single' && payingTipAction.tipId === tip.id}
              onStartEditing={startEditing}
              onNoteChange={setNoteDraft}
              onSaveNote={saveNote}
              onCancelEditing={cancelEditing}
              onPayTip={handlePayTipClick}
            />
          ))}
        </div>
      )}

      {/* Drawer for selecting payment method */}
      <TipPaymentMethodDrawer
        isOpen={payingTipAction !== null}
        onOpenChange={(open) => !open && setPayingTipAction(null)}
        title={drawerTitle}
        description={drawerDescription}
        confirmLoading={isProcessingPayment}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
