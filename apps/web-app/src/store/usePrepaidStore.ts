import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PrepaidOrder, PrepaidStatus } from '@/types';
import supabase from '@/lib/supabaseClient';
import { getVenezuelaDate } from '@/services/DateService';

interface PrepaidState {
  prepaidOrders: PrepaidOrder[];

  // Acciones de prepagados
  addPrepaidOrder: (
    order: Omit<PrepaidOrder, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<any>;
  updatePrepaidOrder: (
    id: string,
    updates: Partial<PrepaidOrder>
  ) => Promise<void>;
  deletePrepaidOrder: (id: string) => Promise<void>;
  markPrepaidAsDelivered: (id: string) => Promise<void>;

  // Inicialización
  setPrepaidOrders: (orders: PrepaidOrder[]) => void;
}

export const usePrepaidStore = create<PrepaidState>()(
  persist(
    (set, get) => ({
      prepaidOrders: [],

      setPrepaidOrders: (orders) => set({ prepaidOrders: orders }),

      addPrepaidOrder: async (order) => {
        try {
          const payload = {
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            liters: order.liters,
            amount_bs: order.amountBs,
            amount_usd: order.amountUsd,
            exchange_rate: order.exchangeRate,
            payment_method: order.paymentMethod,
            status: order.status,
            date_paid: order.datePaid,
            date_delivered: order.dateDelivered,
            notes: order.notes,
          };

          const { data, error } = await supabase
            .from('prepaid_orders')
            .insert(payload)
            .select('*')
            .single();

          if (error) throw error;

          const newPrepaid: PrepaidOrder = {
            id: data.id,
            customerName: data.customer_name ?? data.customerName,
            customerPhone: data.customer_phone ?? data.customerPhone,
            liters: Number(data.liters),
            amountBs: Number(data.amount_bs ?? data.amountBs ?? 0),
            amountUsd: Number(data.amount_usd ?? data.amountUsd ?? 0),
            exchangeRate: Number(data.exchange_rate ?? data.exchangeRate ?? 0),
            paymentMethod: data.payment_method ?? data.paymentMethod,
            status: data.status,
            datePaid: data.date_paid ?? data.datePaid,
            dateDelivered: data.date_delivered ?? data.dateDelivered,
            notes: data.notes,
            createdAt: data.created_at ?? data.createdAt,
            updatedAt: data.updated_at ?? data.updatedAt,
          };

          set((state) => ({
            prepaidOrders: [...state.prepaidOrders, newPrepaid],
          }));
          return data;
        } catch (err) {
          console.error('Supabase insert prepaid_orders failed:', err);
          throw err;
        }
      },

      updatePrepaidOrder: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.customerName !== undefined)
            payload.customer_name = updates.customerName;
          if (updates.customerPhone !== undefined)
            payload.customer_phone = updates.customerPhone;
          if (updates.liters !== undefined) payload.liters = updates.liters;
          if (updates.amountBs !== undefined)
            payload.amount_bs = updates.amountBs;
          if (updates.amountUsd !== undefined)
            payload.amount_usd = updates.amountUsd;
          if (updates.exchangeRate !== undefined)
            payload.exchange_rate = updates.exchangeRate;
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.datePaid !== undefined)
            payload.date_paid = updates.datePaid;
          if (updates.dateDelivered !== undefined)
            payload.date_delivered = updates.dateDelivered;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          payload.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('prepaid_orders')
            .update(payload)
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? { ...order, ...updates, updatedAt: new Date().toISOString() }
                : order
            ),
          }));
        } catch (err) {
          console.error('Failed to update prepaid order in Supabase', err);
          throw err;
        }
      },

      deletePrepaidOrder: async (id) => {
        try {
          const { error } = await supabase
            .from('prepaid_orders')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            prepaidOrders: state.prepaidOrders.filter(
              (order) => order.id !== id
            ),
          }));
        } catch (err) {
          console.error('Failed to delete prepaid order from Supabase', err);
          throw err;
        }
      },

      markPrepaidAsDelivered: async (id) => {
        const dateDelivered = getVenezuelaDate();
        const updatedAt = new Date().toISOString();
        try {
          const { error } = await supabase
            .from('prepaid_orders')
            .update({
              status: 'entregado',
              date_delivered: dateDelivered,
              updated_at: updatedAt,
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? {
                    ...order,
                    status: 'entregado' as PrepaidStatus,
                    dateDelivered,
                    updatedAt,
                  }
                : order
            ),
          }));
        } catch (err) {
          console.error('Failed to mark prepaid as delivered in Supabase', err);
          throw err;
        }
      },
    }),
    {
      name: 'aquagest-prepaid-storage',
    }
  )
);
