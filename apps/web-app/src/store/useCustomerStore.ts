import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import {
  enqueueOfflineCustomerCreate,
  enqueueOfflineCustomerDelete,
  enqueueOfflineCustomerUpdate,
} from '@/offline/enqueue/customersEnqueue';

interface CustomerState {
  customers: Customer[];

  addCustomer: (customer: CustomerDraft) => Promise<void>;
  updateCustomer: (id: string, updates: CustomerUpdate) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  setCustomers: (customers: Customer[]) => void;
}
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: [],

      setCustomers: (customers) => set({ customers }),

      addCustomer: async (customer) => {
        try {
          if (!window.navigator.onLine) {
            const offlineCustomer = enqueueOfflineCustomerCreate(customer);
            set((state) => ({
              customers: [...state.customers, offlineCustomer],
            }));
            return;
          }

          const data = await appRepositories.customersRepository.create(customer);

          set((state) => ({
            customers: [
              ...state.customers,
              {
                  id: data.id,
                  name: data.name,
                  phone: data.phone,
                  address: data.address,
                },
              ],
            }));
        } catch (err: unknown) {
          console.error('Failed to add customer to Supabase', err);
          throw err;
        }
      },

        updateCustomer: async (id, updates) => {
          try {
            if (!window.navigator.onLine) {
              enqueueOfflineCustomerUpdate(id, updates);

              set((state) => ({
                customers: state.customers.map((c) =>
                c.id === id ? { ...c, ...updates } : c
              ),
            }));
              return;
            }

            await appRepositories.customersRepository.update(id, updates);

            set((state) => ({
              customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
        } catch (err: unknown) {
          console.error('Failed to update customer in Supabase', err);
          throw err;
        }
      },

      deleteCustomer: async (id) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineCustomerDelete(id);

            set((state) => ({
              customers: state.customers.filter((c) => c.id !== id),
            }));
              return;
            }

            await appRepositories.customersRepository.delete(id);

            set((state) => ({
              customers: state.customers.filter((c) => c.id !== id),
          }));
        } catch (err: unknown) {
          console.error('Failed to delete customer from Supabase', err);
          throw err;
        }
      },
    }),
    {
      name: 'aquagest-customer-storage',
    }
  )
);
