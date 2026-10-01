import type { WashingMachine } from '@aqua-guest/domain';

export type WashingMachineRow = {
  id: string;
  name: string;
  kg: number;
  brand: string;
  status: WashingMachine['status'];
  is_available: boolean;
};

export type WashingMachineUpdateRow = {
  name?: string;
  kg?: number;
  brand?: string;
  status?: WashingMachine['status'];
  is_available?: boolean;
};
