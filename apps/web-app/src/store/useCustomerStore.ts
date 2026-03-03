import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '@/types';
import supabase from '@/lib/supabaseClient';

interface CustomerState {
  customers: Customer[];

  addCustomer: (customer: CustomerCreateInput) => Promise<void>;
  updateCustomer: (id: string, updates: CustomerUpdateInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  setCustomers: (customers: Customer[]) => void;
}

type CustomerCreateInput = Omit<Customer, 'id'>;
type CustomerUpdateInput = Partial<Omit<Customer, 'id'>>;

const buildCustomerUpdatePayload = (
  updates: CustomerUpdateInput
): CustomerUpdateInput => {
  const payload: CustomerUpdateInput = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.address !== undefined) payload.address = updates.address;

  return payload;
};

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: [],

      setCustomers: (customers) => set({ customers }),

      addCustomer: async (customer) => {
        try {
          const { data, error } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
            })
            .select('*')
            .single();

          if (error) throw error;
          if (!data) {
            throw new Error('Missing customer data from Supabase');
          }

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
          const payload = buildCustomerUpdatePayload(updates);

          const { error } = await supabase
            .from('customers')
            .update(payload)
            .eq('id', id);

          if (error) throw error;

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
          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        } catch (err: unknown) {
          console.error('Failed to delete customer from Supabase', err);
          // Fallback local

          throw err;
        }
      },
    }),
    {
      name: 'aquagest-customer-storage',
    }
  )
);
