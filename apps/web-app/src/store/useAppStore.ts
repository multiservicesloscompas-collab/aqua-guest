import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sale,
  Expense,
  AppConfig,
  CartItem,
  Product,
  PaymentMethod,
  WasherRental,
  WashingMachine,
  Customer,
  LiterPricing,
  DEFAULT_LITER_BREAKPOINTS,
  ExchangeRateHistory,
  PrepaidOrder,
  PrepaidStatus,
  PaymentBalanceTransaction,
  PaymentBalanceSummary,
} from '@/types';
import supabase from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { defaultWashingMachines } from '@/data/washingMachines';

interface AppState {
  // Configuración
  config: AppConfig;
  products: Product[];
  washingMachines: WashingMachine[];
  customers: Customer[];

  // Datos
  sales: Sale[];
  expenses: Expense[];
  rentals: WasherRental[];
  prepaidOrders: PrepaidOrder[];
  paymentBalanceTransactions: PaymentBalanceTransaction[];

  // Carrito actual
  cart: CartItem[];
  selectedDate: string;

  // Acciones de configuración
  setExchangeRate: (rate: number) => void;
  setLiterPricing: (pricing: LiterPricing[]) => Promise<void>;
  getExchangeRateForDate: (date: string) => number;
  getPriceForLiters: (liters: number) => number;

  // Acciones del carrito
  addToCart: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Acciones de ventas
  completeSale: (paymentMethod: PaymentMethod, notes?: string) => Promise<Sale>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  // Acciones de egresos
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Acciones de alquileres
  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateRental: (id: string, updates: Partial<WasherRental>) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;

  // Acciones de prepagados
  addPrepaidOrder: (
    order: Omit<PrepaidOrder, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<any>;
  updatePrepaidOrder: (
    id: string,
    updates: Partial<PrepaidOrder>
  ) => Promise<void>;
  deletePrepaidOrder: (id: string) => Promise<void>;
  markPrepaidAsDelivered: (id: string) => Promise<void>;
  getRentalsByDate: (date: string) => WasherRental[];

  // Acciones de clientes
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Acciones de lavadoras
  addWashingMachine: (machine: Omit<WashingMachine, 'id'>) => Promise<void>;
  updateWashingMachine: (
    id: string,
    updates: Partial<WashingMachine>
  ) => Promise<void>;
  deleteWashingMachine: (id: string) => Promise<void>;

  // Acciones de equilibrio de pagos
  addPaymentBalanceTransaction: (
    transaction: Omit<
      PaymentBalanceTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => Promise<void>;
  updatePaymentBalanceTransaction: (
    id: string,
    updates: Partial<PaymentBalanceTransaction>
  ) => Promise<void>;
  deletePaymentBalanceTransaction: (id: string) => Promise<void>;
  getPaymentBalanceSummary: (date: string) => PaymentBalanceSummary[];
  loadPaymentBalanceTransactions: () => Promise<void>;

  // Utilidades
  setSelectedDate: (date: string) => void;
  getSalesByDate: (date: string) => Sale[];
  getExpensesByDate: (date: string) => Expense[];
  loadFromSupabase: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const today = new Date().toISOString().split('T')[0];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: {
        exchangeRate: 36.5,
        lastUpdated: new Date().toISOString(),
        literPricing: DEFAULT_LITER_BREAKPOINTS,
        exchangeRateHistory: [],
      },
      products: defaultProducts,
      washingMachines: defaultWashingMachines,
      customers: [],
      sales: [],
      expenses: [],
      rentals: [],
      prepaidOrders: [],
      paymentBalanceTransactions: [],
      cart: [],
      selectedDate: today,

      // Configuración
      setExchangeRate: async (rate) => {
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = get().config.exchangeRateHistory.findIndex(
          (h: ExchangeRateHistory) => h.date === today
        );
        const newHistoryEntry: ExchangeRateHistory = {
          date: today,
          rate,
          updatedAt: new Date().toISOString(),
        };

        let updatedHistory: ExchangeRateHistory[];
        if (existingIndex >= 0) {
          // Actualizar entrada existente del día
          updatedHistory = get().config.exchangeRateHistory.map(
            (h: ExchangeRateHistory, i: number) =>
              i === existingIndex ? newHistoryEntry : h
          );
        } else {
          // Agregar nueva entrada
          updatedHistory = [
            ...get().config.exchangeRateHistory,
            newHistoryEntry,
          ];
        }

        // Update local state
        set((state) => ({
          config: {
            ...state.config,
            exchangeRate: rate,
            lastUpdated: new Date().toISOString(),
            exchangeRateHistory: updatedHistory,
          },
        }));

        // Try to save to Supabase
        try {
          // Use onConflict to handle unique constraint on 'date'
          const { error } = await supabase.from('exchange_rates').upsert(
            {
              date: today,
              rate,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'date' }
          );

          if (error) throw error;
        } catch (err) {
          console.error('Failed to save exchange rate to Supabase', err);
        }
      },

      getExchangeRateForDate: (date) => {
        const { config } = get();
        const historyEntry = config.exchangeRateHistory.find(
          (h: ExchangeRateHistory) => h.date === date
        );
        if (historyEntry) return historyEntry.rate;

        // Buscar la tasa del día anterior más cercano
        const sortedHistory = [...config.exchangeRateHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const previousEntry = sortedHistory.find((h) => h.date < date);
        return previousEntry?.rate || config.exchangeRate;
      },

      setLiterPricing: async (pricing) => {
        try {
          // Fetch existing liter pricing records
          const { data: existingPricing, error: fetchError } = await supabase
            .from('liter_pricing')
            .select('id, breakpoint, price');
          if (fetchError) throw fetchError;

          // Create payload
          const payload = pricing.map((p) => {
            const existing = existingPricing?.find(
              (ep: any) => Number(ep.breakpoint) === Number(p.breakpoint)
            );
            return {
              ...(existing ? { id: existing.id } : {}),
              breakpoint: p.breakpoint,
              price: p.price,
            };
          });

          // To avoid the "null value in column 'id'" error caused by PostgREST padding
          // missing keys in a batch, we separate updates (with id) from inserts (without id).
          const updates = payload.filter((p) => 'id' in p);
          const inserts = payload.filter((p) => !('id' in p));

          if (updates.length > 0) {
            const { error: updateError } = await supabase
              .from('liter_pricing')
              .upsert(updates);
            if (updateError) throw updateError;
          }

          if (inserts.length > 0) {
            const { error: insertError } = await supabase
              .from('liter_pricing')
              .insert(inserts);
            if (insertError) throw insertError;
          }

          // If succeeds, update local state
          set((state) => ({
            config: {
              ...state.config,
              literPricing: pricing,
              lastUpdated: new Date().toISOString(),
            },
          }));
        } catch (err) {
          // Fallback to local state and surface the error in console
          console.error('Failed to persist liter pricing to Supabase', err);
          set((state) => ({
            config: {
              ...state.config,
              literPricing: pricing,
              lastUpdated: new Date().toISOString(),
            },
          }));
          // rethrow so callers can react
          throw err;
        }
      },

      getPriceForLiters: (liters) => {
        const { literPricing } = get().config;
        const pricing = literPricing || DEFAULT_LITER_BREAKPOINTS;
        // Ordenar breakpoints de menor a mayor
        const sortedPricing = [...pricing].sort(
          (a, b) => a.breakpoint - b.breakpoint
        );

        // Encontrar el breakpoint que corresponde (redondear hacia arriba)
        for (const bp of sortedPricing) {
          if (liters <= bp.breakpoint) {
            return bp.price;
          }
        }

        // Si excede todos los breakpoints, usar el último precio
        return sortedPricing[sortedPricing.length - 1]?.price || 0;
      },

      // Load data from Supabase
      loadFromSupabase: async () => {
        try {
          // Fetch core tables in parallel
          const [
            customersRes,
            machinesRes,
            rentalsRes,
            productsRes,
            salesRes,
            expensesRes,
            prepaidRes,
            literPricingRes,
            exchangeRatesRes,
            balanceTransactionsRes,
          ] = await Promise.all([
            supabase.from('customers').select('*'),
            supabase.from('washing_machines').select('*'),
            supabase
              .from('washer_rentals')
              .select('*, customers(name, phone, address)'),
            supabase.from('products').select('*'),
            supabase.from('sales').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('prepaid_orders').select('*'),
            supabase.from('liter_pricing').select('*'),
            supabase.from('exchange_rates').select('*'),
            supabase
              .from('payment_balance_transactions')
              .select('*')
              .order('created_at', { ascending: false }),
          ]);

          const customers = customersRes.data || [];
          const machines = machinesRes.data || [];
          const rentals = (rentalsRes.data || []).map((r: any) => ({
            id: r.id,
            date: r.date,
            customerId: r.customer_id,
            customerName: r.customers?.name || r.customer_name,
            customerPhone: r.customers?.phone || r.customer_phone,
            customerAddress: r.customers?.address || r.customer_address,
            machineId: r.machine_id,
            shift: r.shift,
            deliveryTime: r.delivery_time
              ? r.delivery_time.substring(0, 5)
              : '',
            pickupTime: r.pickup_time ? r.pickup_time.substring(0, 5) : '',
            pickupDate: r.pickup_date,
            deliveryFee: Number(r.delivery_fee),
            totalUsd: Number(r.total_usd),
            paymentMethod: r.payment_method || 'efectivo',
            status: r.status,
            isPaid: r.is_paid,
            notes: r.notes,
            createdAt: r.created_at ?? r.createdAt,
            updatedAt: r.updated_at ?? r.updatedAt,
          }));
          const products = (productsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            defaultPrice: Number(p.default_price),
            requiresLiters: p.requires_liters,
            minLiters: p.min_liters,
            maxLiters: p.max_liters,
            icon: p.icon,
          }));
          const sales = (salesRes.data || []).map((s: any) => ({
            id: s.id,
            dailyNumber: s.daily_number ?? s.dailyNumber,
            date: s.date,
            items: s.items || [],
            paymentMethod: s.payment_method || s.paymentMethod,
            totalBs: Number(s.total_bs ?? s.totalBs ?? 0),
            totalUsd: Number(s.total_usd ?? s.totalUsd ?? 0),
            exchangeRate: Number(s.exchange_rate ?? s.exchangeRate ?? 0),
            notes: s.notes,
            createdAt: s.created_at ?? s.createdAt ?? new Date().toISOString(),
            updatedAt: s.updated_at ?? s.updatedAt ?? new Date().toISOString(),
          }));
          const expenses = (expensesRes.data || []).map((e: any) => ({
            ...e,
            paymentMethod: e.payment_method || 'efectivo',
            createdAt: e.created_at ?? e.createdAt,
          }));
          const prepaid = (prepaidRes.data || []).map((p: any) => ({
            id: p.id,
            customerName: p.customer_name ?? p.customerName,
            customerPhone: p.customer_phone ?? p.customerPhone,
            liters: Number(p.liters),
            amountBs: Number(p.amount_bs ?? p.amountBs ?? 0),
            amountUsd: Number(p.amount_usd ?? p.amountUsd ?? 0),
            exchangeRate: Number(p.exchange_rate ?? p.exchangeRate ?? 0),
            paymentMethod: p.payment_method ?? p.paymentMethod,
            status: p.status,
            datePaid: p.date_paid ?? p.datePaid,
            dateDelivered: p.date_delivered ?? p.dateDelivered,
            notes: p.notes,
            createdAt: p.created_at ?? p.createdAt,
            updatedAt: p.updated_at ?? p.updatedAt,
          }));
          const literPricing = (literPricingRes.data || []).map((l: any) => ({
            breakpoint: Number(l.breakpoint),
            price: Number(l.price),
          }));

          // Process payment balance transactions
          const paymentBalanceTransactions = (
            balanceTransactionsRes.data || []
          ).map((t: any) => ({
            id: t.id,
            date: t.date,
            fromMethod: t.from_method,
            toMethod: t.to_method,
            amount: Number(t.amount),
            amountBs: t.amount_bs ? Number(t.amount_bs) : Number(t.amount),
            amountUsd: t.amount_usd ? Number(t.amount_usd) : undefined,
            notes: t.notes,
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || new Date().toISOString(),
          }));
          // Process Exchange Rates with explicit logging
          let latestExchangeRate = get().config.exchangeRate;
          let exchangeHistory: ExchangeRateHistory[] =
            get().config.exchangeRateHistory;

          if (exchangeRatesRes.error) {
            console.error(
              'Error fetching exchange rates:',
              exchangeRatesRes.error
            );
          } else if (exchangeRatesRes.data) {
            console.log(
              'Supabase Response - Exchange Rates:',
              exchangeRatesRes.data
            );
            const mappedHistory = exchangeRatesRes.data.map((x: any) => ({
              date: x.date,
              rate: Number(x.rate),
              updatedAt: x.updated_at ?? x.updatedAt,
            }));

            // Sort history by date descending to find the latest
            mappedHistory.sort(
              (a: ExchangeRateHistory, b: ExchangeRateHistory) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            exchangeHistory = mappedHistory;
            if (exchangeHistory.length > 0) {
              latestExchangeRate = exchangeHistory[0].rate;
              console.log('New Latest Exchange Rate:', latestExchangeRate);
            }
          }

          set((state) => ({
            customers,
            washingMachines: machines,
            rentals,
            products: products.length ? products : defaultProducts,
            sales,
            expenses,
            prepaidOrders: prepaid,
            paymentBalanceTransactions,
            config: {
              ...state.config,
              literPricing: literPricing.length
                ? literPricing
                : state.config.literPricing,
              exchangeRateHistory: exchangeHistory,
              // Use latest rate from DB if available, otherwise keep current
              exchangeRate: latestExchangeRate,
              lastUpdated: new Date().toISOString(),
            },
          }));
        } catch (err) {
          // ignore for now; keep local state
          console.error('Error loading from Supabase', err);
        }
      },

      // Carrito
      addToCart: (item) =>
        set((state) => ({
          cart: [
            ...state.cart,
            {
              ...item,
              id: generateId(),
              subtotal: item.quantity * item.unitPrice,
            },
          ],
        })),

      updateCartItem: (id, updates) =>
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.subtotal = updated.quantity * updated.unitPrice;
            return updated;
          }),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),

      // Ventas
      completeSale: async (paymentMethod, notes) => {
        const state = get();
        const totalBs = state.cart.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );

        // Calcular el número diario incremental
        const salesOfDay = state.sales.filter(
          (s) => s.date === state.selectedDate
        );
        const dailyNumber = salesOfDay.length + 1;

        const newSale = {
          daily_number: dailyNumber,
          date: state.selectedDate,
          items: state.cart,
          payment_method: paymentMethod,
          total_bs: totalBs,
          total_usd: totalBs / state.config.exchangeRate,
          exchange_rate: state.config.exchangeRate,
          notes,
        } as any;

        try {
          const { data, error } = await supabase
            .from('sales')
            .insert(newSale)
            .select('*')
            .single();
          if (error) throw error;

          const sale: Sale = {
            id: data.id,
            dailyNumber: data.daily_number,
            date: data.date,
            items: data.items,
            paymentMethod: data.payment_method,
            totalBs: Number(data.total_bs),
            totalUsd: Number(data.total_usd),
            exchangeRate: Number(data.exchange_rate),
            notes: data.notes,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          };

          set((state) => ({ sales: [...state.sales, sale], cart: [] }));
          return sale;
        } catch (err) {
          // fallback local
          const sale: Sale = {
            id: generateId(),
            dailyNumber,
            date: state.selectedDate,
            items: [...state.cart],
            paymentMethod,
            totalBs,
            totalUsd: totalBs / state.config.exchangeRate,
            exchangeRate: state.config.exchangeRate,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ sales: [...state.sales, sale], cart: [] }));
          return sale;
        }
      },

      updateSale: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.totalBs !== undefined) payload.total_bs = updates.totalBs;
          if (updates.totalUsd !== undefined)
            payload.total_usd = updates.totalUsd;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.items !== undefined) payload.items = updates.items;
          payload.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('sales')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            sales: state.sales.map((sale) =>
              sale.id === id
                ? { ...sale, ...updates, updatedAt: new Date().toISOString() }
                : sale
            ),
          }));
        } catch (err) {
          console.error('Failed to update sale in Supabase', err);
          // Still update local state as fallback
          set((state) => ({
            sales: state.sales.map((sale) =>
              sale.id === id
                ? { ...sale, ...updates, updatedAt: new Date().toISOString() }
                : sale
            ),
          }));
        }
      },

      deleteSale: async (id) => {
        try {
          const { error } = await supabase.from('sales').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            sales: state.sales.filter((sale) => sale.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete sale from Supabase', err);
          // Still remove from local state as fallback
          set((state) => ({
            sales: state.sales.filter((sale) => sale.id !== id),
          }));
        }
      },

      // Egresos
      addExpense: async (expense) => {
        try {
          const payload = {
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            payment_method: expense.paymentMethod,
            notes: expense.notes,
          };
          const { data, error } = await supabase
            .from('expenses')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;
          set((state) => ({
            expenses: [
              ...state.expenses,
              {
                ...data,
                id: data.id,
                paymentMethod: data.payment_method || 'efectivo',
                createdAt: data.created_at,
              },
            ],
          }));
        } catch (err) {
          console.error('Failed to add expense to Supabase', err);
          throw err; // Re-throw error to let UI handle it
        }
      },

      updateExpense: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.description !== undefined)
            payload.description = updates.description;
          if (updates.amount !== undefined) payload.amount = updates.amount;
          if (updates.category !== undefined)
            payload.category = updates.category;
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.date !== undefined) payload.date = updates.date;

          const { error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates } : exp
            ),
          }));
        } catch (err) {
          console.error('Failed to update expense in Supabase', err);
          // Still update local state as fallback
          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates } : exp
            ),
          }));
        }
      },

      deleteExpense: async (id) => {
        try {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete expense from Supabase', err);
          // Still remove from local state as fallback
          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
          }));
        }
      },

      // Alquileres
      addRental: async (rental) => {
        try {
          const payload: any = {
            date: rental.date,
            customer_id: rental.customerId || null,
            machine_id: rental.machineId,
            shift: rental.shift,
            delivery_time: rental.deliveryTime,
            pickup_time: rental.pickupTime,
            pickup_date: rental.pickupDate,
            delivery_fee: rental.deliveryFee,
            total_usd: rental.totalUsd,
            payment_method: rental.paymentMethod,
            status: rental.status,
            is_paid: rental.isPaid,
            notes: rental.notes,
          };
          const { data, error } = await supabase
            .from('washer_rentals')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;
          const newRental: WasherRental = {
            id: data.id,
            date: data.date,
            customerId: data.customer_id,
            customerName: data.customers?.name || rental.customerName,
            customerPhone: data.customers?.phone || rental.customerPhone,
            customerAddress: data.customers?.address || rental.customerAddress,
            machineId: data.machine_id,
            shift: data.shift,
            deliveryTime: data.delivery_time,
            pickupTime: data.pickup_time,
            pickupDate: data.pickup_date,
            deliveryFee: Number(data.delivery_fee),
            totalUsd: Number(data.total_usd),
            paymentMethod: data.payment_method || rental.paymentMethod,
            status: data.status,
            isPaid: data.is_paid,
            notes: data.notes,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          };
          set((state) => ({ rentals: [...state.rentals, newRental] }));

          // Save customer locally if provided and not exists, then update rental with customer ID
          if (!rental.customerId && rental.customerName) {
            const exists = get().customers.find(
              (c) => c.name.toLowerCase() === rental.customerName.toLowerCase()
            );
            if (!exists) {
              try {
                const { data: cdata, error: cerr } = await supabase
                  .from('customers')
                  .insert({
                    name: rental.customerName,
                    phone: rental.customerPhone,
                    address: rental.customerAddress,
                  })
                  .select('*')
                  .single();
                if (!cerr && cdata) {
                  // Update the rental with the new customer ID
                  const { error: updateError } = await supabase
                    .from('washer_rentals')
                    .update({ customer_id: cdata.id })
                    .eq('id', newRental.id);

                  if (!updateError) {
                    newRental.customerId = cdata.id;
                    // Update local state with the customer ID
                    set((state) => ({
                      rentals: state.rentals.map((r) =>
                        r.id === newRental.id
                          ? { ...r, customerId: cdata.id }
                          : r
                      ),
                      customers: [
                        ...state.customers,
                        {
                          id: cdata.id,
                          name: cdata.name,
                          phone: cdata.phone,
                          address: cdata.address,
                        },
                      ],
                    }));
                  } else {
                    console.error(
                      'Failed to update rental with customer ID:',
                      updateError
                    );
                    // Still add customer to local state
                    set((state) => ({
                      customers: [
                        ...state.customers,
                        {
                          id: cdata.id,
                          name: cdata.name,
                          phone: cdata.phone,
                          address: cdata.address,
                        },
                      ],
                    }));
                  }
                } else {
                  set((state) => ({
                    customers: [
                      ...state.customers,
                      {
                        id: generateId(),
                        name: rental.customerName,
                        phone: rental.customerPhone,
                        address: rental.customerAddress,
                      },
                    ],
                  }));
                }
              } catch (err) {
                set((state) => ({
                  customers: [
                    ...state.customers,
                    {
                      id: generateId(),
                      name: rental.customerName,
                      phone: rental.customerPhone,
                      address: rental.customerAddress,
                    },
                  ],
                }));
              }
            }
          }
        } catch (err) {
          console.error('Failed to add rental to Supabase', err);
          throw err; // Don't add locally if Supabase fails
        }
      },

      updateRental: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.machineId !== undefined)
            payload.machine_id = updates.machineId;
          if (updates.shift !== undefined) payload.shift = updates.shift;
          if (updates.date !== undefined) payload.date = updates.date;
          if (updates.deliveryTime !== undefined)
            payload.delivery_time = updates.deliveryTime;
          if (updates.pickupTime !== undefined)
            payload.pickup_time = updates.pickupTime;
          if (updates.pickupDate !== undefined)
            payload.pickup_date = updates.pickupDate;
          if (updates.deliveryFee !== undefined)
            payload.delivery_fee = updates.deliveryFee;
          if (updates.totalUsd !== undefined)
            payload.total_usd = updates.totalUsd;
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.customerId !== undefined)
            payload.customer_id = updates.customerId;

          // Handle customer data updates separately
          const customerUpdates: any = {};
          if (updates.customerName !== undefined)
            customerUpdates.name = updates.customerName;
          if (updates.customerPhone !== undefined)
            customerUpdates.phone = updates.customerPhone;
          if (updates.customerAddress !== undefined)
            customerUpdates.address = updates.customerAddress;

          payload.updated_at = new Date().toISOString();

          // Update customer if there are customer updates
          if (Object.keys(customerUpdates).length > 0 && updates.customerId) {
            const { error: customerError } = await supabase
              .from('customers')
              .update(customerUpdates)
              .eq('id', updates.customerId);
            if (customerError) throw customerError;
          }

          const { error } = await supabase
            .from('washer_rentals')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            rentals: state.rentals.map((rental) =>
              rental.id === id
                ? { ...rental, ...updates, updatedAt: new Date().toISOString() }
                : rental
            ),
          }));
        } catch (err) {
          console.error('Failed to update rental in Supabase', err);
          // Still update local state as fallback
          set((state) => ({
            rentals: state.rentals.map((rental) =>
              rental.id === id
                ? { ...rental, ...updates, updatedAt: new Date().toISOString() }
                : rental
            ),
          }));
          throw err; // Re-throw to let UI handle the error
        }
      },

      deleteRental: async (id) => {
        try {
          const { error } = await supabase
            .from('washer_rentals')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            rentals: state.rentals.filter((rental) => rental.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete rental from Supabase', err);
          // Still remove from local state as fallback
          set((state) => ({
            rentals: state.rentals.filter((rental) => rental.id !== id),
          }));
        }
      },

      getRentalsByDate: (date) =>
        get().rentals.filter((rental) => rental.date === date),

      // Prepagados
      addPrepaidOrder: async (order) => {
        try {
          const payload = {
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            liters: order.liters,
            amount_bs: order.amountBs,
            amount_usd: order.amountUsd,
            exchange_rate: order.exchangeRate,
            payment_method: order.paymentMethod,
            status: order.status,
            date_paid: order.datePaid,
            date_delivered: order.dateDelivered,
            notes: order.notes,
          };
          console.debug('addPrepaidOrder called, payload=', payload);
          console.debug(
            'supabase client exists?',
            !!supabase && typeof supabase.from === 'function'
          );
          const { data, error } = await supabase
            .from('prepaid_orders')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;
          const newPrepaid: PrepaidOrder = {
            id: data.id,
            customerName: data.customer_name ?? data.customerName,
            customerPhone: data.customer_phone ?? data.customerPhone,
            liters: Number(data.liters),
            amountBs: Number(data.amount_bs ?? data.amountBs ?? 0),
            amountUsd: Number(data.amount_usd ?? data.amountUsd ?? 0),
            exchangeRate: Number(data.exchange_rate ?? data.exchangeRate ?? 0),
            paymentMethod: data.payment_method ?? data.paymentMethod,
            status: data.status,
            datePaid: data.date_paid ?? data.datePaid,
            dateDelivered: data.date_delivered ?? data.dateDelivered,
            notes: data.notes,
            createdAt: data.created_at ?? data.createdAt,
            updatedAt: data.updated_at ?? data.updatedAt,
          };
          set((state) => ({
            prepaidOrders: [...state.prepaidOrders, newPrepaid],
          }));
          return data;
        } catch (err) {
          // fallback to local state but surface the error so UI can react
          console.error('Supabase insert prepaid_orders failed:', err);
          set((state) => ({
            prepaidOrders: [
              ...state.prepaidOrders,
              {
                ...order,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }));
          throw err;
        }
      },

      updatePrepaidOrder: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.customerName !== undefined)
            payload.customer_name = updates.customerName;
          if (updates.customerPhone !== undefined)
            payload.customer_phone = updates.customerPhone;
          if (updates.liters !== undefined) payload.liters = updates.liters;
          if (updates.amountBs !== undefined)
            payload.amount_bs = updates.amountBs;
          if (updates.amountUsd !== undefined)
            payload.amount_usd = updates.amountUsd;
          if (updates.exchangeRate !== undefined)
            payload.exchange_rate = updates.exchangeRate;
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.datePaid !== undefined)
            payload.date_paid = updates.datePaid;
          if (updates.dateDelivered !== undefined)
            payload.date_delivered = updates.dateDelivered;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          payload.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('prepaid_orders')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? { ...order, ...updates, updatedAt: new Date().toISOString() }
                : order
            ),
          }));
        } catch (err) {
          console.error('Failed to update prepaid order in Supabase', err);
          // Still update local state as fallback
          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? { ...order, ...updates, updatedAt: new Date().toISOString() }
                : order
            ),
          }));
        }
      },

      deletePrepaidOrder: async (id) => {
        try {
          const { error } = await supabase
            .from('prepaid_orders')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            prepaidOrders: state.prepaidOrders.filter(
              (order) => order.id !== id
            ),
          }));
        } catch (err) {
          console.error('Failed to delete prepaid order from Supabase', err);
          // Still remove from local state as fallback
          set((state) => ({
            prepaidOrders: state.prepaidOrders.filter(
              (order) => order.id !== id
            ),
          }));
        }
      },

      markPrepaidAsDelivered: async (id) => {
        const dateDelivered = new Date().toISOString().split('T')[0];
        const updatedAt = new Date().toISOString();
        try {
          const { error } = await supabase
            .from('prepaid_orders')
            .update({
              status: 'entregado',
              date_delivered: dateDelivered,
              updated_at: updatedAt,
            })
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? {
                    ...order,
                    status: 'entregado' as PrepaidStatus,
                    dateDelivered: dateDelivered,
                    updatedAt,
                  }
                : order
            ),
          }));
        } catch (err) {
          console.error('Failed to mark prepaid as delivered in Supabase', err);
          // Fallback local
          set((state) => ({
            prepaidOrders: state.prepaidOrders.map((order) =>
              order.id === id
                ? {
                    ...order,
                    status: 'entregado' as PrepaidStatus,
                    dateDelivered: dateDelivered,
                    updatedAt,
                  }
                : order
            ),
          }));
        }
      },

      // Clientes
      addCustomer: async (customer) => {
        try {
          const { data, error } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
            })
            .select('*')
            .single();
          if (error) throw error;
          set((state) => ({
            customers: [
              ...state.customers,
              {
                id: data.id,
                name: data.name,
                phone: data.phone,
                address: data.address,
              },
            ],
          }));
        } catch (err) {
          set((state) => ({
            customers: [...state.customers, { ...customer, id: generateId() }],
          }));
        }
      },

      updateCustomer: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.phone !== undefined) payload.phone = updates.phone;
          if (updates.address !== undefined) payload.address = updates.address;

          const { error } = await supabase
            .from('customers')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
        } catch (err) {
          console.error('Failed to update customer in Supabase', err);
          // Fallback local
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
        }
      },

      deleteCustomer: async (id) => {
        try {
          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete customer from Supabase', err);
          // Fallback local
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        }
      },

      // Lavadoras
      addWashingMachine: async (machine) => {
        try {
          const { data, error } = await supabase
            .from('washing_machines')
            .insert({
              name: machine.name,
              kg: machine.kg,
              brand: machine.brand,
              status: machine.status,
              is_available: machine.isAvailable,
            })
            .select('*')
            .single();
          if (error) throw error;
          set((state) => ({
            washingMachines: [
              ...state.washingMachines,
              {
                id: data.id,
                name: data.name,
                kg: data.kg,
                brand: data.brand,
                status: data.status,
                isAvailable: data.is_available,
              },
            ],
          }));
        } catch (err) {
          set((state) => ({
            washingMachines: [
              ...state.washingMachines,
              { ...machine, id: generateId() },
            ],
          }));
        }
      },

      updateWashingMachine: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.kg !== undefined) payload.kg = updates.kg;
          if (updates.brand !== undefined) payload.brand = updates.brand;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.isAvailable !== undefined)
            payload.is_available = updates.isAvailable;

          const { error } = await supabase
            .from('washing_machines')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            washingMachines: state.washingMachines.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }));
        } catch (err) {
          console.error('Failed to update washing machine in Supabase', err);
          // Fallback local
          set((state) => ({
            washingMachines: state.washingMachines.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }));
        }
      },

      deleteWashingMachine: async (id) => {
        try {
          const { error } = await supabase
            .from('washing_machines')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            washingMachines: state.washingMachines.filter((m) => m.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete washing machine from Supabase', err);
          // Fallback local
          set((state) => ({
            washingMachines: state.washingMachines.filter((m) => m.id !== id),
          }));
        }
      },

      // Acciones de equilibrio de pagos
      addPaymentBalanceTransaction: async (transaction) => {
        try {
          const payload = {
            date: transaction.date,
            from_method: transaction.fromMethod,
            to_method: transaction.toMethod,
            amount: transaction.amount,
            notes: transaction.notes,
          };
          const { data, error } = await supabase
            .from('payment_balance_transactions')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;

          const newTransaction: PaymentBalanceTransaction = {
            id: data.id,
            date: data.date,
            fromMethod: data.from_method,
            toMethod: data.to_method,
            amount: Number(data.amount),
            notes: data.notes,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          };

          set((state) => ({
            paymentBalanceTransactions: [
              ...state.paymentBalanceTransactions,
              newTransaction,
            ],
          }));
        } catch (err) {
          console.error(
            'Failed to add payment balance transaction to Supabase',
            err
          );
          throw err; // Lanzar el error para que el componente lo maneje
        }
      },

      updatePaymentBalanceTransaction: async (id, updates) => {
        try {
          const payload: any = {};
          if (updates.fromMethod !== undefined)
            payload.from_method = updates.fromMethod;
          if (updates.toMethod !== undefined)
            payload.to_method = updates.toMethod;
          if (updates.amount !== undefined) payload.amount = updates.amount;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.date !== undefined) payload.date = updates.date;
          payload.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from('payment_balance_transactions')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.map(
              (transaction) =>
                transaction.id === id
                  ? {
                      ...transaction,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    }
                  : transaction
            ),
          }));
        } catch (err) {
          console.error(
            'Failed to update payment balance transaction in Supabase',
            err
          );
          // Fallback local
          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.map(
              (transaction) =>
                transaction.id === id
                  ? {
                      ...transaction,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    }
                  : transaction
            ),
          }));
        }
      },

      deletePaymentBalanceTransaction: async (id) => {
        try {
          const { error } = await supabase
            .from('payment_balance_transactions')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.filter(
              (transaction) => transaction.id !== id
            ),
          }));
        } catch (err) {
          console.error(
            'Failed to delete payment balance transaction from Supabase',
            err
          );
          // Fallback local
          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.filter(
              (transaction) => transaction.id !== id
            ),
          }));
        }
      },

      getPaymentBalanceSummary: (date) => {
        const {
          sales,
          rentals,
          prepaidOrders,
          paymentBalanceTransactions,
          config,
        } = get();

        // Calcular totales originales por método de pago
        const salesOfDay = sales.filter((s) => s.date === date);
        const rentalsOfDay = rentals.filter((r) => r.date === date);
        const prepaidOfDay = prepaidOrders.filter((p) => p.datePaid === date);

        const calculateOriginalTotal = (method: PaymentMethod) => {
          const salesTotal = salesOfDay
            .filter((s) => s.paymentMethod === method)
            .reduce((sum, s) => sum + s.totalBs, 0);
          const rentalsTotal = rentalsOfDay
            .filter((r) => r.paymentMethod === method)
            .reduce((sum, r) => sum + r.totalUsd * config.exchangeRate, 0);
          const prepaidTotal = prepaidOfDay
            .filter((p) => p.paymentMethod === method)
            .reduce((sum, p) => sum + p.amountBs, 0);

          return salesTotal + rentalsTotal + prepaidTotal;
        };

        // Calcular ajustes por transacciones de equilibrio
        const balanceTransactionsOfDay = paymentBalanceTransactions.filter(
          (t) => t.date === date
        );

        const calculateAdjustments = (method: PaymentMethod) => {
          return balanceTransactionsOfDay.reduce((adjustment, transaction) => {
            if (transaction.fromMethod === method) {
              // Sale dinero de este método
              if (method === 'divisa') {
                // Si sale de divisa, restar el monto en USD convertido a Bs
                const usdAmount =
                  transaction.amountUsd ||
                  transaction.amount / config.exchangeRate;
                return adjustment - usdAmount * config.exchangeRate;
              } else {
                // Si sale de Bs, restar el monto en Bs directamente
                return adjustment - transaction.amount;
              }
            } else if (transaction.toMethod === method) {
              // Entra dinero a este método
              if (method === 'divisa') {
                // Si entra a divisa, sumar el monto en USD convertido a Bs
                const usdAmount =
                  transaction.amountUsd ||
                  transaction.amount / config.exchangeRate;
                return adjustment + usdAmount * config.exchangeRate;
              } else {
                // Si entra a Bs, sumar el monto en Bs directamente
                return adjustment + transaction.amount;
              }
            }
            return adjustment;
          }, 0);
        };

        // Generar resumen para cada método de pago
        const methods: PaymentMethod[] = [
          'efectivo',
          'pago_movil',
          'punto_venta',
          'divisa',
        ];
        return methods.map((method) => {
          const originalTotal = calculateOriginalTotal(method);
          const adjustments = calculateAdjustments(method);
          const finalTotal = originalTotal + adjustments;

          return {
            method,
            originalTotal,
            adjustments,
            finalTotal,
          } as PaymentBalanceSummary;
        });
      },

      // Utilidades
      setSelectedDate: (date) => set({ selectedDate: date }),

      getSalesByDate: (date) =>
        get()
          .sales.filter((sale) => sale.date === date)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),

      getExpensesByDate: (date) =>
        get().expenses.filter((exp) => exp.date === date),

      // Cargar transacciones de equilibrio desde Supabase
      loadPaymentBalanceTransactions: async () => {
        try {
          const { data, error } = await supabase
            .from('payment_balance_transactions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          const transactions = (data || []).map((t: any) => ({
            id: t.id,
            date: t.date,
            fromMethod: t.from_method,
            toMethod: t.to_method,
            amount: Number(t.amount),
            amountBs: t.amount_bs ? Number(t.amount_bs) : Number(t.amount),
            amountUsd: t.amount_usd ? Number(t.amount_usd) : undefined,
            notes: t.notes,
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || new Date().toISOString(),
          }));

          set((state) => ({
            paymentBalanceTransactions: transactions,
          }));
        } catch (err) {
          console.error(
            'Error loading payment balance transactions from Supabase',
            err
          );
          // Keep local state if Supabase fails
        }
      },
    }),
    {
      name: 'agua-app-storage',
    }
  )
);

// Attempt to load initial data from Supabase on module import
try {
  // call asynchronously and ignore result
  useAppStore.getState().loadFromSupabase &&
    useAppStore.getState().loadFromSupabase();
} catch (err) {
  // ignore
}
