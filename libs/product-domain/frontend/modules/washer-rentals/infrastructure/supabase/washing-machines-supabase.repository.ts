import type {
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate,
} from '@aqua-guest/domain';
import type { WashingMachinesRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toWashingMachine,
  toWashingMachineCreatePayload,
  toWashingMachineUpdatePayload,
} from './washer-rentals.supabase.mappers';
import type { WashingMachineRow } from './washer-rentals.supabase.types';

const washingMachinesGetAllConfig: SupabaseGetAllConfig = {
  table: 'washing_machines',
  select: [
    'id',
    'name',
    'kg',
    'brand',
    'status',
    'isAvailable:is_available',
  ].join(', '),
  defaultOrderBy: 'name',
  defaultAscending: true,
};

export const createWashingMachinesSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): WashingMachinesRepository =>
  createSupabaseBaseRepository<
    WashingMachine,
    WashingMachineRow,
    WashingMachineDraft,
    WashingMachineUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: WashingMachineRow[] | WashingMachineRow | null;
      error: unknown;
    }>,
    config: washingMachinesGetAllConfig,
    toEntity: toWashingMachine,
    toCreatePayload: toWashingMachineCreatePayload,
    toUpdatePayload: toWashingMachineUpdatePayload,
  });
