import supabaseClient from '@/lib/supabaseClient';
import {
  createExchangeRatesSupabaseRepository,
  createExpensesSupabaseRepository,
  createPaymentBalanceSupabaseRepository,
  createTipsSupabaseRepository,
  createWaterSalesSupabaseRepositories,
  createWasherRentalsSupabaseRepositories,
  type CustomersRepository,
  type ExchangeRatesRepository,
  type ExpensesRepository,
  type LiterPricingRepository,
  type PaymentBalanceRepository,
  type PrepaidOrdersRepository,
  type ProductsRepository,
  type RentalShiftsRepository,
  type SalesRepository,
  type SupabaseClientLike,
  type TipsRepository,
  type WasherRentalsRepository,
  type WashingMachinesRepository,
} from '@aqua-guest/product-domain/frontend';

export interface AppRepositories {
  exchangeRatesRepository: ExchangeRatesRepository;
  expensesRepository: ExpensesRepository;
  paymentBalanceRepository: PaymentBalanceRepository;
  tipsRepository: TipsRepository;
  salesRepository: SalesRepository;
  productsRepository: ProductsRepository;
  literPricingRepository: LiterPricingRepository;
  customersRepository: CustomersRepository;
  washingMachinesRepository: WashingMachinesRepository;
  prepaidOrdersRepository: PrepaidOrdersRepository;
  rentalShiftsRepository: RentalShiftsRepository;
  washerRentalsRepository: WasherRentalsRepository;
}

export const createAppRepositories = ({
  supabase,
}: {
  supabase: unknown;
}): AppRepositories => {
  const client = supabase as SupabaseClientLike<{
    data: unknown;
    error: unknown;
  }>;
  const waterSales: {
    salesRepository: SalesRepository;
    productsRepository: ProductsRepository;
    literPricingRepository: LiterPricingRepository;
  } = createWaterSalesSupabaseRepositories({ supabase: client });
  const washerRentals: {
    customersRepository: CustomersRepository;
    washingMachinesRepository: WashingMachinesRepository;
    prepaidOrdersRepository: PrepaidOrdersRepository;
    rentalShiftsRepository: RentalShiftsRepository;
    washerRentalsRepository: WasherRentalsRepository;
  } = createWasherRentalsSupabaseRepositories({ supabase: client });

  return {
    exchangeRatesRepository: createExchangeRatesSupabaseRepository(client),
    expensesRepository: createExpensesSupabaseRepository(client),
    paymentBalanceRepository: createPaymentBalanceSupabaseRepository(client),
    tipsRepository: createTipsSupabaseRepository(client),
    ...waterSales,
    ...washerRentals,
  };
};

let cachedAppRepositories: AppRepositories | null = null;

const getDefaultAppRepositories = (): AppRepositories => {
  if (!cachedAppRepositories) {
    cachedAppRepositories = createAppRepositories({
      supabase: supabaseClient,
    });
  }

  return cachedAppRepositories;
};

export const appRepositories: AppRepositories = {
  get exchangeRatesRepository() {
    return getDefaultAppRepositories().exchangeRatesRepository;
  },
  get expensesRepository() {
    return getDefaultAppRepositories().expensesRepository;
  },
  get paymentBalanceRepository() {
    return getDefaultAppRepositories().paymentBalanceRepository;
  },
  get tipsRepository() {
    return getDefaultAppRepositories().tipsRepository;
  },
  get salesRepository() {
    return getDefaultAppRepositories().salesRepository;
  },
  get productsRepository() {
    return getDefaultAppRepositories().productsRepository;
  },
  get literPricingRepository() {
    return getDefaultAppRepositories().literPricingRepository;
  },
  get customersRepository() {
    return getDefaultAppRepositories().customersRepository;
  },
  get washingMachinesRepository() {
    return getDefaultAppRepositories().washingMachinesRepository;
  },
  get prepaidOrdersRepository() {
    return getDefaultAppRepositories().prepaidOrdersRepository;
  },
  get rentalShiftsRepository() {
    return getDefaultAppRepositories().rentalShiftsRepository;
  },
  get washerRentalsRepository() {
    return getDefaultAppRepositories().washerRentalsRepository;
  },
};
