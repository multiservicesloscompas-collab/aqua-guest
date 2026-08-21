import type {
  RentalShiftConfig,
  RentalShiftConfigDraft,
  RentalShiftConfigUpdate,
} from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export type RentalShiftsRepository = BaseRepository<
  RentalShiftConfig,
  RentalShiftConfigDraft,
  RentalShiftConfigUpdate
>;
