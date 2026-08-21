import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PrepaidOrder,
  PrepaidOrderDraft,
  PrepaidOrderUpdate,
  PrepaidStatus,
} from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import { getVenezuelaDate } from '@/services/DateService';
import {
  enqueueOfflinePrepaidCreate,
  enqueueOfflinePrepaidDelete,
  enqueueOfflinePrepaidUpdate,
} from '@/offline/enqueue/prepaidEnqueue';

interface PrepaidState {
  prepaidOrders: PrepaidOrder[];

  addPrepaidOrder: (order: PrepaidOrderDraft) => Promise<PrepaidOrder>;
  updatePrepaidOrder: (
    id: string,
    updates: Partial<PrepaidOrderUpdate>
  ) => Promise<void>;
  deletePrepaidOrder: (id: string) => Promise<void>;
  markPrepaidAsDelivered: (id: string) => Promise<void>;

  setPrepaidOrders: (orders: PrepaidOrder[]) => void;
}
export const usePrepaidStore = create<PrepaidState>()(
  persist(
    (set) => ({
      prepaidOrders: [],

      setPrepaidOrders: (orders) => set({ prepaidOrders: orders }),

      addPrepaidOrder: async (order) => {
        try {
          const timestamp = new Date().toISOString();
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

          if (!window.navigator.onLine) {
            const offlineOrder = enqueueOfflinePrepaidCreate({
              payload,
              order,
              createdAt: timestamp,
              updatedAt: timestamp,
            });

            set((state) => ({
              prepaidOrders: [...state.prepaidOrders, offlineOrder],
            }));
            return offlineOrder;
          }

          const newPrepaid = await appRepositories.prepaidOrdersRepository.create(order);

          set((state) => ({
            prepaidOrders: [...state.prepaidOrders, newPrepaid],
          }));
          return newPrepaid;
        } catch (err) {
          console.error('Supabase insert prepaid_orders failed:', err);
          throw err;
        }
      },

      updatePrepaidOrder: async (id, updates) => {
        try {
          const updatedAt = new Date().toISOString();
          const repositoryUpdates = { ...updates, updatedAt };

          if (!window.navigator.onLine) {
            enqueueOfflinePrepaidUpdate({
              id,
              payload: {
                ...(updates.customerName !== undefined
                  ? { customer_name: updates.customerName }
                  : {}),
                ...(updates.customerPhone !== undefined
                  ? { customer_phone: updates.customerPhone }
                  : {}),
                ...(updates.liters !== undefined ? { liters: updates.liters } : {}),
                ...(updates.amountBs !== undefined
                  ? { amount_bs: updates.amountBs }
                  : {}),
                ...(updates.amountUsd !== undefined
                  ? { amount_usd: updates.amountUsd }
                  : {}),
                ...(updates.exchangeRate !== undefined
                  ? { exchange_rate: updates.exchangeRate }
                  : {}),
                ...(updates.paymentMethod !== undefined
                  ? { payment_method: updates.paymentMethod }
                  : {}),
                ...(updates.status !== undefined ? { status: updates.status } : {}),
                ...(updates.datePaid !== undefined
                  ? { date_paid: updates.datePaid }
                  : {}),
                ...(updates.dateDelivered !== undefined
                  ? { date_delivered: updates.dateDelivered }
                  : {}),
                ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
                updated_at: updatedAt,
              },
            });

            set((state) => ({
              prepaidOrders: state.prepaidOrders.map((order) =>
                order.id === id ? { ...order, ...updates, updatedAt } : order
              ),
            }));
            return;
          }

          await appRepositories.prepaidOrdersRepository.update(id, repositoryUpdates);

          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id ? { ...order, ...updates, updatedAt } : order
            ),
          }));
        } catch (err) {
          console.error('Failed to update prepaid order in Supabase', err);
          throw err;
        }
      },

      deletePrepaidOrder: async (id) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflinePrepaidDelete(id);

            set((state) => ({
              prepaidOrders: state.prepaidOrders.filter(
                (order) => order.id !== id
              ),
            }));
            return;
          }

          await appRepositories.prepaidOrdersRepository.delete(id);

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
          if (!window.navigator.onLine) {
            enqueueOfflinePrepaidUpdate({
              id,
              payload: {
                status: 'entregado',
                date_delivered: dateDelivered,
                updated_at: updatedAt,
              },
              actionSource: 'prepaid/markPrepaidAsDelivered',
            });

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
            return;
          }

          await appRepositories.prepaidOrdersRepository.update(id, {
            status: 'entregado',
            dateDelivered,
            updatedAt,
          });

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
