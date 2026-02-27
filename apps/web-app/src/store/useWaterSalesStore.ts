import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, PaymentMethod, Sale } from '@/types';
import supabase from '@/lib/supabaseClient';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import { dateService } from '@/services/DateService';
import {
  DateFilterStrategy,
  SalesFilterService,
} from '@/services/SalesFilterService';
import { salesDataService } from '@/services/SalesDataService';
import { useConfigStore } from './useConfigStore';

interface WaterSalesState {
  sales: Sale[];
  cart: CartItem[];
  loadingSalesByRange: Record<string, boolean>;

  // Acciones del carrito
  addToCart: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Acciones de ventas
  completeSale: (
    paymentMethod: PaymentMethod,
    selectedDate: string,
    notes?: string
  ) => Promise<Sale>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  // Utilidades y Carga
  getSalesByDate: (date: string) => Sale[];
  loadSalesByDate: (date: string) => Promise<Sale[]>;
  loadSalesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  setSales: (sales: Sale[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

interface SalesRow {
  id: string;
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  total_bs: number;
  total_usd: number;
  exchange_rate: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type SaleInsert = {
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  total_bs: number;
  total_usd: number;
  exchange_rate: number;
  notes?: string;
};

type SaleUpdate = Partial<{
  payment_method: PaymentMethod;
  total_bs: number;
  total_usd: number;
  notes?: string;
  items?: CartItem[];
  updated_at: string;
}>;

export const useWaterSalesStore = create<WaterSalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      cart: [],
      loadingSalesByRange: {},

      setSales: (sales) => set({ sales }),

      // Carrito
      addToCart: (item) =>
        set((state) => ({
          cart: [
            ...state.cart,
            {
              ...item,
              id: generateId(),
              subtotal: item.quantity * item.unitPrice,
            },
          ],
        })),

      updateCartItem: (id, updates) =>
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.subtotal = updated.quantity * updated.unitPrice;
            return updated;
          }),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),

      // Ventas
      completeSale: async (paymentMethod, selectedDate, notes) => {
        const state = get();
        const configState = useConfigStore.getState();
        const exchangeRate = configState.config.exchangeRate;

        const totalBs = state.cart.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );

        const normalizedDate = dateService.normalizeSaleDate(selectedDate);
        const salesOfDay = state.sales.filter((s) => s.date === normalizedDate);
        const dailyNumber = salesOfDay.length + 1;

        const safeCreatedAt = getSafeTimestamp();
        const safeUpdatedAt = getSafeTimestamp();

        const newSalePayload: SaleInsert = {
          daily_number: dailyNumber,
          date: normalizedDate,
          items: state.cart,
          payment_method: paymentMethod,
          total_bs: totalBs,
          total_usd: totalBs / exchangeRate,
          exchange_rate: exchangeRate,
          notes: notes || undefined,
        };

        try {
          const { data, error } = await supabase
            .from('sales')
            .insert(newSalePayload)
            .select('*')
            .single();
          if (error) throw error;

          const saleRow = data as SalesRow | null;
          if (!saleRow) {
            throw new Error('Error al crear la venta');
          }

          const saleDate = dateService.normalizeSaleDate(
            saleRow.date || normalizedDate
          );

          const sale: Sale = {
            id: saleRow.id,
            dailyNumber: saleRow.daily_number,
            date: saleDate,
            items: saleRow.items,
            paymentMethod: saleRow.payment_method,
            totalBs: Number(saleRow.total_bs),
            totalUsd: Number(saleRow.total_usd),
            exchangeRate: Number(saleRow.exchange_rate),
            notes: saleRow.notes || undefined,
            createdAt: normalizeTimestamp(
              saleRow.created_at ?? undefined,
              safeCreatedAt
            ),
            updatedAt: normalizeTimestamp(
              saleRow.updated_at ?? undefined,
              safeUpdatedAt
            ),
          };

          set((state) => ({ sales: [...state.sales, sale], cart: [] }));
          salesDataService.invalidateCache(sale.date);
          return sale;
        } catch (err) {
          console.error('Failed to create sale in Supabase', err);
          throw err;
        }
      },

      updateSale: async (id, updates) => {
        try {
          const payload: SaleUpdate = {};
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.totalBs !== undefined) payload.total_bs = updates.totalBs;
          if (updates.totalUsd !== undefined)
            payload.total_usd = updates.totalUsd;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.items !== undefined) payload.items = updates.items;
          payload.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('sales')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            sales: state.sales.map((sale) =>
              sale.id === id
                ? { ...sale, ...updates, updatedAt: new Date().toISOString() }
                : sale
            ),
          }));
          const updatedSale = get().sales.find((s) => s.id === id);
          if (updatedSale) {
            salesDataService.invalidateCache(updatedSale.date);
          }
        } catch (err) {
          console.error('Failed to update sale in Supabase', err);
          throw err;
        }
      },

      deleteSale: async (id) => {
        const saleToDelete = get().sales.find((s) => s.id === id);
        try {
          const { error } = await supabase.from('sales').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            sales: state.sales.filter((sale) => sale.id !== id),
          }));
          if (saleToDelete) {
            salesDataService.invalidateCache(saleToDelete.date);
          }
        } catch (err) {
          console.error('Failed to delete sale from Supabase', err);
          throw err;
        }
      },

      getSalesByDate: (date) => {
        const normalizedDate = dateService.normalizeSaleDate(date);
        const filterService = new SalesFilterService(
          new DateFilterStrategy(dateService)
        );
        return filterService
          .filterSales(get().sales, normalizedDate)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
      },

      loadSalesByDate: async (date) => {
        try {
          const sales = await salesDataService.loadSalesByDate(date);
          set((state) => {
            const existingSales = state.sales.filter((s) => s.date !== date);
            return { sales: [...existingSales, ...sales] };
          });
          return sales;
        } catch (err) {
          console.error('Error loading sales by date:', err);
          throw err;
        }
      },

      loadSalesByDateRange: async (startDate, endDate) => {
        const rangeKey = `${startDate}_${endDate}`;
        if (get().loadingSalesByRange[rangeKey]) return;
        set((state) => ({
          loadingSalesByRange: {
            ...state.loadingSalesByRange,
            [rangeKey]: true,
          },
        }));

        try {
          const dates: string[] = [];
          const current = new Date(startDate + 'T12:00:00');
          const end = new Date(endDate + 'T12:00:00');
          while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
          }

          if (dates.length === 0) return;

          const salesMap = await salesDataService.loadSalesByDateRange(
            startDate,
            endDate
          );
          const allSales: Sale[] = [];
          for (const entries of salesMap.values()) {
            allSales.push(...entries);
          }

          const loadedDatesSet = new Set(dates);

          set((state) => {
            const map = new Map<string, Sale>();
            state.sales
              .filter((item) => !loadedDatesSet.has(item.date))
              .forEach((item) => map.set(item.id, item));
            allSales.forEach((item) => map.set(item.id, item));
            return { sales: Array.from(map.values()) };
          });
        } catch (err) {
          console.error('Error loading sales for date range:', err);
        } finally {
          set((state) => ({
            loadingSalesByRange: {
              ...state.loadingSalesByRange,
              [rangeKey]: false,
            },
          }));
        }
      },
    }),
    {
      name: 'aquagest-water-sales-storage',
    }
  )
);
