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
  RentalStatus,
  WashingMachine,
  Customer,
  LiterPricing,
  DEFAULT_LITER_BREAKPOINTS,
  ExchangeRateHistory,
  PrepaidOrder,
  PrepaidStatus,
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
  completeSale: (paymentMethod: PaymentMethod, notes?: string) => Sale;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  // Acciones de egresos
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Acciones de alquileres
  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateRental: (id: string, updates: Partial<WasherRental>) => void;
  deleteRental: (id: string) => void;

  // Acciones de prepagados
  addPrepaidOrder: (
    order: Omit<PrepaidOrder, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updatePrepaidOrder: (id: string, updates: Partial<PrepaidOrder>) => void;
  deletePrepaidOrder: (id: string) => void;
  markPrepaidAsDelivered: (id: string) => void;
  getRentalsByDate: (date: string) => WasherRental[];

  // Acciones de clientes
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Acciones de lavadoras
  addWashingMachine: (machine: Omit<WashingMachine, 'id'>) => void;
  updateWashingMachine: (id: string, updates: Partial<WashingMachine>) => void;
  deleteWashingMachine: (id: string) => void;

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
      cart: [],
      selectedDate: today,

      // Configuración
      setExchangeRate: async (rate) => {
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = get().config.exchangeRateHistory.findIndex(
          (h) => h.date === today
        );
        const newHistoryEntry: ExchangeRateHistory = {
          date: today,
          rate,
          updatedAt: new Date().toISOString(),
        };

        let updatedHistory: ExchangeRateHistory[];
        if (existingIndex >= 0) {
          // Actualizar entrada existente del día
          updatedHistory = get().config.exchangeRateHistory.map((h, i) =>
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
          (h) => h.date === date
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

          // Create payload with id if exists
          const payload = pricing.map((p) => {
            const existing = existingPricing?.find(
              (ep) => ep.breakpoint === p.breakpoint
            );
            return {
              ...(existing ? { id: existing.id } : {}),
              breakpoint: p.breakpoint,
              price: p.price,
            };
          });

          // Upsert the pricing records
          const { error: upsertError } = await supabase
            .from('liter_pricing')
            .upsert(payload);
          if (upsertError) throw upsertError;

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
            deliveryTime: r.delivery_time,
            pickupTime: r.pickup_time,
            pickupDate: r.pickup_date,
            deliveryFee: Number(r.delivery_fee),
            totalUsd: Number(r.total_usd),
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
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
              { ...data, id: data.id, createdAt: data.created_at },
            ],
          }));
        } catch (err) {
          set((state) => ({
            expenses: [
              ...state.expenses,
              {
                ...expense,
                id: generateId(),
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      updateExpense: (id, updates) =>
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === id ? { ...exp, ...updates } : exp
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        })),

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
            status: data.status,
            isPaid: data.is_paid,
            notes: data.notes,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          };
          set((state) => ({ rentals: [...state.rentals, newRental] }));

          // Save customer locally if provided and not exists
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
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          payload.updated_at = new Date().toISOString();

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

      markPrepaidAsDelivered: (id) =>
        set((state) => ({
          prepaidOrders: state.prepaidOrders.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status: 'entregado' as PrepaidStatus,
                  dateDelivered: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        })),

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

      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),

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

      updateWashingMachine: (id, updates) =>
        set((state) => ({
          washingMachines: state.washingMachines.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteWashingMachine: (id) =>
        set((state) => ({
          washingMachines: state.washingMachines.filter((m) => m.id !== id),
        })),

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
