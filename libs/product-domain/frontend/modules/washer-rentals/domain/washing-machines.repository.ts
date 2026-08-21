import type {
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate,
} from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export type WashingMachinesRepository = BaseRepository<
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate
>;
