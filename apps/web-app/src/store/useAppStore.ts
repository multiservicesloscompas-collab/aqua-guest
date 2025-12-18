import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sale, Expense, AppConfig, CartItem, Product, PaymentMethod, WasherRental, RentalStatus, WashingMachine, Customer, LiterPricing, DEFAULT_LITER_BREAKPOINTS, ExchangeRateHistory, PrepaidOrder, PrepaidStatus } from '@/types';
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
  setLiterPricing: (pricing: LiterPricing[]) => void;
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
  addRental: (rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRental: (id: string, updates: Partial<WasherRental>) => void;
  deleteRental: (id: string) => void;
  
  // Acciones de prepagados
  addPrepaidOrder: (order: Omit<PrepaidOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const today = new Date().toISOString().split('T')[0];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: {
        exchangeRate: 36.50,
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
      setExchangeRate: (rate) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const existingIndex = state.config.exchangeRateHistory.findIndex(h => h.date === today);
          const newHistoryEntry: ExchangeRateHistory = {
            date: today,
            rate,
            updatedAt: new Date().toISOString(),
          };
          
          let updatedHistory: ExchangeRateHistory[];
          if (existingIndex >= 0) {
            // Actualizar entrada existente del día
            updatedHistory = state.config.exchangeRateHistory.map((h, i) => 
              i === existingIndex ? newHistoryEntry : h
            );
          } else {
            // Agregar nueva entrada
            updatedHistory = [...state.config.exchangeRateHistory, newHistoryEntry];
          }
          
          return {
            config: {
              ...state.config,
              exchangeRate: rate,
              lastUpdated: new Date().toISOString(),
              exchangeRateHistory: updatedHistory,
            },
          };
        }),
      
      getExchangeRateForDate: (date) => {
        const { config } = get();
        const historyEntry = config.exchangeRateHistory.find(h => h.date === date);
        if (historyEntry) return historyEntry.rate;
        
        // Buscar la tasa del día anterior más cercano
        const sortedHistory = [...config.exchangeRateHistory].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const previousEntry = sortedHistory.find(h => h.date < date);
        return previousEntry?.rate || config.exchangeRate;
      },

      setLiterPricing: (pricing) =>
        set((state) => ({
          config: {
            ...state.config,
            literPricing: pricing,
            lastUpdated: new Date().toISOString(),
          },
        })),

      getPriceForLiters: (liters) => {
        const { literPricing } = get().config;
        const pricing = literPricing || DEFAULT_LITER_BREAKPOINTS;
        // Ordenar breakpoints de menor a mayor
        const sortedPricing = [...pricing].sort((a, b) => a.breakpoint - b.breakpoint);
        
        // Encontrar el breakpoint que corresponde (redondear hacia arriba)
        for (const bp of sortedPricing) {
          if (liters <= bp.breakpoint) {
            return bp.price;
          }
        }
        
        // Si excede todos los breakpoints, usar el último precio
        return sortedPricing[sortedPricing.length - 1]?.price || 0;
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
      completeSale: (paymentMethod, notes) => {
        const state = get();
        const totalBs = state.cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Calcular el número diario incremental
        const salesOfDay = state.sales.filter(s => s.date === state.selectedDate);
        const dailyNumber = salesOfDay.length + 1;
        
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

        set((state) => ({
          sales: [...state.sales, sale],
          cart: [],
        }));

        return sale;
      },

      updateSale: (id, updates) =>
        set((state) => ({
          sales: state.sales.map((sale) =>
            sale.id === id
              ? { ...sale, ...updates, updatedAt: new Date().toISOString() }
              : sale
          ),
        })),

      deleteSale: (id) =>
        set((state) => ({
          sales: state.sales.filter((sale) => sale.id !== id),
        })),

      // Egresos
      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            {
              ...expense,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

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
      addRental: (rental) =>
        set((state) => {
          const newRental: WasherRental = {
            ...rental,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Guardar cliente si es nuevo
          if (!rental.customerId && rental.customerName) {
            const existingCustomer = state.customers.find(
              c => c.name.toLowerCase() === rental.customerName.toLowerCase()
            );
            if (!existingCustomer) {
              return {
                rentals: [...state.rentals, newRental],
                customers: [
                  ...state.customers,
                  {
                    id: generateId(),
                    name: rental.customerName,
                    phone: rental.customerPhone,
                    address: rental.customerAddress,
                  },
                ],
              };
            }
          }
          
          return { rentals: [...state.rentals, newRental] };
        }),

      updateRental: (id, updates) =>
        set((state) => ({
          rentals: state.rentals.map((rental) =>
            rental.id === id
              ? { ...rental, ...updates, updatedAt: new Date().toISOString() }
              : rental
          ),
        })),

      deleteRental: (id) =>
        set((state) => ({
          rentals: state.rentals.filter((rental) => rental.id !== id),
        })),

      getRentalsByDate: (date) => get().rentals.filter((rental) => rental.date === date),

      // Prepagados
      addPrepaidOrder: (order) =>
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
        })),

      updatePrepaidOrder: (id, updates) =>
        set((state) => ({
          prepaidOrders: state.prepaidOrders.map((order) =>
            order.id === id
              ? { ...order, ...updates, updatedAt: new Date().toISOString() }
              : order
          ),
        })),

      deletePrepaidOrder: (id) =>
        set((state) => ({
          prepaidOrders: state.prepaidOrders.filter((order) => order.id !== id),
        })),

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
      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            { ...customer, id: generateId() },
          ],
        })),

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
      addWashingMachine: (machine) =>
        set((state) => ({
          washingMachines: [
            ...state.washingMachines,
            { ...machine, id: generateId() },
          ],
        })),

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

      getSalesByDate: (date) => get().sales.filter((sale) => sale.date === date),

      getExpensesByDate: (date) =>
        get().expenses.filter((exp) => exp.date === date),
    }),
    {
      name: 'agua-app-storage',
    }
  )
);
