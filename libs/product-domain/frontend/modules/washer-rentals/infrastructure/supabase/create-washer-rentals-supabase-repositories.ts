import type {
  CustomersRepository,
  PrepaidOrdersRepository,
  RentalShiftsRepository,
  WasherRentalsRepository,
  WashingMachinesRepository,
} from '../../domain';
import type { SupabaseClientLike } from '../../../../shared/infrastructure/supabase';
import { createCustomersSupabaseRepository } from './customers-supabase.repository';
import { createPrepaidOrdersSupabaseRepository } from './prepaid-orders-supabase.repository';
import { createRentalShiftsSupabaseRepository } from './rental-shifts-supabase.repository';
import { createWasherRentalsSupabaseRepository } from './washer-rentals-supabase.repository';
import { createWashingMachinesSupabaseRepository } from './washing-machines-supabase.repository';

export interface CreateWasherRentalsSupabaseRepositoriesParams {
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>;
}

export interface WasherRentalsSupabaseRepositories {
  customersRepository: CustomersRepository;
  washingMachinesRepository: WashingMachinesRepository;
  prepaidOrdersRepository: PrepaidOrdersRepository;
  rentalShiftsRepository: RentalShiftsRepository;
  washerRentalsRepository: WasherRentalsRepository;
}

export const createWasherRentalsSupabaseRepositories = ({
  supabase,
}: CreateWasherRentalsSupabaseRepositoriesParams): WasherRentalsSupabaseRepositories => ({
  customersRepository: createCustomersSupabaseRepository(supabase),
  washingMachinesRepository: createWashingMachinesSupabaseRepository(supabase),
  prepaidOrdersRepository: createPrepaidOrdersSupabaseRepository(supabase),
  rentalShiftsRepository: createRentalShiftsSupabaseRepository(supabase),
  washerRentalsRepository: createWasherRentalsSupabaseRepository(supabase),
});
