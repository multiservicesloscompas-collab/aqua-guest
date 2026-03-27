import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DateSelector } from '@/components/ventas/DateSelector';
import { useAppStore } from '@/store/useAppStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useTipStore } from '@/store/useTipStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { normalizeToVenezuelaDate } from '@/services/DateService';
import { TipCard } from './components/TipCard';
import { TipDaySummaryCard } from './components/TipDaySummaryCard';
import { resolveTipOriginLabel } from './utils';

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
  const [payingTipId, setPayingTipId] = useState<string | null>(null);
  const [payingAll, setPayingAll] = useState(false);

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

  const payTip = async (tipId: string) => {
    const tip = tipsForDay.find((item) => item.id === tipId);
    if (!tip || tip.status === 'paid') {
      return;
    }

    setPayingTipId(tipId);
    try {
      await paySingleTip({
        tipId,
        tipDate: selectedDate,
        paymentMethod: tip.capturePaymentMethod,
      });
      toast.success('Propina pagada correctamente');
    } catch {
      toast.error('No se pudo pagar la propina');
    } finally {
      setPayingTipId(null);
    }
  };

  const payAllTipsForDay = async () => {
    const pendingTips = tipsForDay.filter((tip) => tip.status === 'pending');
    if (pendingTips.length === 0) {
      return;
    }

    setPayingAll(true);
    try {
      await Promise.all(
        pendingTips.map((tip) =>
          paySingleTip({
            tipId: tip.id,
            tipDate: selectedDate,
            paymentMethod: tip.capturePaymentMethod,
          })
        )
      );
      toast.success('Se pagaron todas las propinas del día');
    } catch {
      toast.error('No se pudieron pagar las propinas del día');
    } finally {
      setPayingAll(false);
    }
  };

  const hasPendingTips = pendingTipsCount > 0;

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
        payingAll={payingAll}
        onPayAllTips={payAllTipsForDay}
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
              isPaying={payingTipId === tip.id}
              onStartEditing={startEditing}
              onNoteChange={setNoteDraft}
              onSaveNote={saveNote}
              onCancelEditing={cancelEditing}
              onPayTip={payTip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
