import { create } from 'zustand';
import type { PaymentMethod } from '@/types';
import type { Tip, TipPayout } from '@/types/tips';
import { normalizeToVenezuelaDate } from '@/services/DateService';
import { tipsDataService } from '@/services/tips/TipDataService';

interface TipState {
  tips: Tip[];
  tipPayouts: TipPayout[];
  loadingByRange: Record<string, boolean>;
  setTips: (tips: Tip[]) => void;
  loadTipsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  loadPaidTipsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  updateTipNote: (tipId: string, notes?: string) => Promise<void>;
  paySingleTip: (input: {
    tipId: string;
    tipDate: string;
    paymentMethod: PaymentMethod;
    paidAt?: string;
  }) => Promise<void>;
  removeTipByOrigin: (originType: string, originId: string) => void;
}

function isDateWithinRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function replaceTipsByDateRange(
  currentTips: readonly Tip[],
  loadedTips: readonly Tip[],
  startDate: string,
  endDate: string,
  resolveDate: (tip: Tip) => string | undefined
) {
  const nextTipsMap = new Map<string, Tip>();

  currentTips
    .filter((tip) => {
      const resolvedDate = resolveDate(tip);
      return !resolvedDate || !isDateWithinRange(resolvedDate, startDate, endDate);
    })
    .forEach((tip) => nextTipsMap.set(tip.id, tip));

  loadedTips.forEach((tip) => nextTipsMap.set(tip.id, tip));

  return Array.from(nextTipsMap.values());
}

export const useTipStore = create<TipState>()((set, get) => ({
  tips: [],
  tipPayouts: [],
  loadingByRange: {},

  setTips: (tips) =>
    set({
      tips,
      tipPayouts: tipsDataService.toTipPayoutReadModel(tips),
    }),

  loadTipsByDateRange: async (startDate, endDate) => {
    const rangeKey = `${startDate}_${endDate}`;
    if (get().loadingByRange[rangeKey]) {
      return;
    }

    set((state) => ({
      loadingByRange: {
        ...state.loadingByRange,
        [rangeKey]: true,
      },
    }));

    try {
      const loadedTips = await tipsDataService.loadTipsByDateRange(
        startDate,
        endDate
      );

      set((state) => {
        const nextTips = replaceTipsByDateRange(
          state.tips,
          loadedTips,
          startDate,
          endDate,
          (tip) => normalizeToVenezuelaDate(tip.tipDate)
        );

        return {
          tips: nextTips,
          tipPayouts: tipsDataService.toTipPayoutReadModel(nextTips),
        };
      });
    } finally {
      set((state) => ({
        loadingByRange: {
          ...state.loadingByRange,
          [rangeKey]: false,
        },
      }));
    }
  },

  loadPaidTipsByDateRange: async (startDate, endDate) => {
    const rangeKey = `paid_${startDate}_${endDate}`;
    if (get().loadingByRange[rangeKey]) {
      return;
    }

    set((state) => ({
      loadingByRange: {
        ...state.loadingByRange,
        [rangeKey]: true,
      },
    }));

    try {
      const loadedTips = await tipsDataService.loadPaidTipsByDateRange(
        startDate,
        endDate
      );

      set((state) => {
        const nextTips = replaceTipsByDateRange(
          state.tips,
          loadedTips,
          startDate,
          endDate,
          (tip) =>
            tip.status === 'paid'
              ? normalizeToVenezuelaDate(tip.paidAt || tip.tipDate)
              : undefined
        );

        return {
          tips: nextTips,
          tipPayouts: tipsDataService.toTipPayoutReadModel(nextTips),
        };
      });
    } finally {
      set((state) => ({
        loadingByRange: {
          ...state.loadingByRange,
          [rangeKey]: false,
        },
      }));
    }
  },

  updateTipNote: async (tipId, notes) => {
    const updatedTip = await tipsDataService.updateTipNote(tipId, notes);

    set((state) => {
      const nextTips = state.tips.map((tip) =>
        tip.id === updatedTip.id ? updatedTip : tip
      );

      return {
        tips: nextTips,
        tipPayouts: tipsDataService.toTipPayoutReadModel(nextTips),
      };
    });
  },

  paySingleTip: async ({ tipId, tipDate, paymentMethod, paidAt }) => {
    const idempotencyKey = `tip-single:${tipId}:${paymentMethod}:${Date.now()}`;
    await tipsDataService.paySingleTip({
      tipId,
      paymentMethod,
      idempotencyKey,
      paidAt,
      tipDate,
    });

    const reloadPromises = [get().loadTipsByDateRange(tipDate, tipDate)];

    if (paidAt) {
      const paidDateOnly = paidAt.split('T')[0];
      reloadPromises.push(get().loadPaidTipsByDateRange(paidDateOnly, paidDateOnly));
    } else {
      reloadPromises.push(get().loadPaidTipsByDateRange(tipDate, tipDate));
    }

    await Promise.all(reloadPromises);
  },

  removeTipByOrigin: (originType, originId) => {
    set((state) => {
      const nextTips = state.tips.filter(
        (t) => !(t.originType === originType && t.originId === originId)
      );
      return {
        tips: nextTips,
        tipPayouts: tipsDataService.toTipPayoutReadModel(nextTips),
      };
    });
  },
}));
