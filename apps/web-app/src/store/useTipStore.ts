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
  updateTipNote: (tipId: string, notes?: string) => Promise<void>;
  paySingleTip: (input: {
    tipId: string;
    tipDate: string;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
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
        const loadedDates = new Set<string>();
        loadedTips.forEach((tip) => {
          loadedDates.add(normalizeToVenezuelaDate(tip.tipDate));
        });

        const nextTips = [
          ...state.tips.filter(
            (tip) => !loadedDates.has(normalizeToVenezuelaDate(tip.tipDate))
          ),
          ...loadedTips,
        ];

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

  paySingleTip: async ({ tipId, tipDate, paymentMethod }) => {
    const idempotencyKey = `tip-single:${tipId}:${paymentMethod}:${Date.now()}`;
    await tipsDataService.paySingleTip({
      tipId,
      paymentMethod,
      idempotencyKey,
    });

    await get().loadTipsByDateRange(tipDate, tipDate);
  },
}));
