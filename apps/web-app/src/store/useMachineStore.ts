import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate,
} from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import {
  enqueueOfflineWashingMachineCreate,
  enqueueOfflineWashingMachineDelete,
  enqueueOfflineWashingMachineUpdate,
} from '@/offline/enqueue/machinesEnqueue';

interface MachineState {
  washingMachines: WashingMachine[];

  addWashingMachine: (machine: WashingMachineDraft) => Promise<void>;
  updateWashingMachine: (id: string, updates: WashingMachineUpdate) => Promise<void>;
  deleteWashingMachine: (id: string) => Promise<void>;

  loadWashingMachines: () => Promise<void>;
}

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

          const data = await appRepositories.washingMachinesRepository.create(machine);
          set((state) => ({
            washingMachines: [
              ...state.washingMachines,
              {
                id: data.id,
                name: data.name,
                kg: data.kg,
                brand: data.brand,
                status: data.status,
                isAvailable: data.isAvailable,
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

          await appRepositories.washingMachinesRepository.update(id, updates);

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

          await appRepositories.washingMachinesRepository.delete(id);
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
          const machines = await appRepositories.washingMachinesRepository.getAll();
          set({ washingMachines: machines });
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

try {
  useMachineStore.getState().loadWashingMachines &&
    useMachineStore.getState().loadWashingMachines();
} catch (err) {
  console.error(err);
}
