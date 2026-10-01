export type MachineStatus = 'disponible' | 'mantenimiento' | 'averiada';

export interface WashingMachine {
  id: string;
  name: string;
  kg: number;
  brand: string;
  status: MachineStatus;
  /** @deprecated use `status === 'disponible'` */
  isAvailable: boolean;
}

export type WashingMachineDraft = Omit<WashingMachine, 'id'>;

export type WashingMachineUpdate = Partial<WashingMachine>;
