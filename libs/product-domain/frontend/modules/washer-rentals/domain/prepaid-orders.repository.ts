import type {
  PrepaidOrder,
  PrepaidOrderDraft,
  PrepaidOrderUpdate,
} from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export type PrepaidOrdersRepository = BaseRepository<
  PrepaidOrder,
  PrepaidOrderDraft,
  PrepaidOrderUpdate
>;
