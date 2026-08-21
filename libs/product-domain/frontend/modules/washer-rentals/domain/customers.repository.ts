import type { Customer, CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export type CustomersRepository = BaseRepository<
  Customer,
  CustomerDraft,
  CustomerUpdate
>;
