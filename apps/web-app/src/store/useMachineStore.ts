import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WashingMachine } from '@/types';
import supabase from '@/lib/supabaseClient';
import {
  enqueueOfflineWashingMachineCreate,
  enqueueOfflineWashingMachineDelete,
  enqueueOfflineWashingMachineUpdate,
} from '@/offline/enqueue/machinesEnqueue';

interface MachineState {
  washingMachines: WashingMachine[];

  addWashingMachine: (machine: Omit<WashingMachine, 'id'>) => Promise<void>;
  updateWashingMachine: (
    id: string,
    updates: Partial<WashingMachine>
  ) => Promise<void>;
  deleteWashingMachine: (id: string) => Promise<void>;

  loadWashingMachines: () => Promise<void>;
}

type WashingMachineUpdatePayload = {
  name?: string;
  kg?: number;
  brand?: string;
  status?: WashingMachine['status'];
  is_available?: boolean;
};

type WashingMachineRow = {
  id: string;
  name: string;
  kg: number;
  brand: string;
  status: WashingMachine['status'];
  is_available: boolean;
};

export const useMachineStore = create<MachineState>()(
  persist(
    (set, get) => ({
      washingMachines: [],

      addWashingMachine: async (machine) => {
        try {
          if (!window.navigator.onLine) {
            const offlineMachine = enqueueOfflineWashingMachineCreate(machine);
            set((state) => ({
              washingMachines: [...state.washingMachines, offlineMachine],
            }));
            return;
          }

          const { data, error } = await supabase
            .from('washing_machines')
            .insert({
              name: machine.name,
              kg: machine.kg,
              brand: machine.brand,
              status: machine.status,
              is_available: machine.isAvailable,
            })
            .select('*')
            .single();
          if (error) throw error;
          set((state) => ({
            washingMachines: [
              ...state.washingMachines,
              {
                id: data.id,
                name: data.name,
                kg: data.kg,
                brand: data.brand,
                status: data.status,
                isAvailable: data.is_available,
              },
            ],
          }));
        } catch (err) {
          console.error('Failed to add washing machine to Supabase', err);
          throw err;
        }
      },

      updateWashingMachine: async (id, updates) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineWashingMachineUpdate(id, updates);
            set((state) => ({
              washingMachines: state.washingMachines.map((m) =>
                m.id === id ? { ...m, ...updates } : m
              ),
            }));
            return;
          }

          const payload: WashingMachineUpdatePayload = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.kg !== undefined) payload.kg = updates.kg;
          if (updates.brand !== undefined) payload.brand = updates.brand;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.isAvailable !== undefined)
            payload.is_available = updates.isAvailable;

          const { error } = await supabase
            .from('washing_machines')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            washingMachines: state.washingMachines.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }));
        } catch (err) {
          console.error('Failed to update washing machine in Supabase', err);
          throw err;
        }
      },

      deleteWashingMachine: async (id) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineWashingMachineDelete(id);
            set((state) => ({
              washingMachines: state.washingMachines.filter((m) => m.id !== id),
            }));
            return;
          }

          const { error } = await supabase
            .from('washing_machines')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            washingMachines: state.washingMachines.filter((m) => m.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete washing machine from Supabase', err);
          throw err;
        }
      },

      loadWashingMachines: async () => {
        try {
          const { data, error } = await supabase
            .from('washing_machines')
            .select('*');
          if (error) throw error;
          if (data) {
            const machines = (data as WashingMachineRow[]).map((m) => ({
              id: m.id,
              name: m.name,
              kg: m.kg,
              brand: m.brand,
              status: m.status,
              isAvailable: m.is_available,
            }));
            set({ washingMachines: machines });
          }
        } catch (error) {
          console.error('Error loading washing machines:', error);
          throw error;
        }
      },
    }),
    {
      name: 'aquagest-machine-storage',
    }
  )
);

// Attempt to load initial data from Supabase on module import
try {
  useMachineStore.getState().loadWashingMachines &&
    useMachineStore.getState().loadWashingMachines();
} catch (err) {
  console.error(err);
}
