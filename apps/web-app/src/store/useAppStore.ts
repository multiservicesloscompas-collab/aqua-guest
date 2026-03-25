import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';
import { ExchangeRateHistory } from '@/types';
import { AuthState, UserProfile } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

import { useCustomerStore } from './useCustomerStore';
import { useConfigStore } from './useConfigStore';
import { useExpenseStore } from './useExpenseStore';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { usePrepaidStore } from './usePrepaidStore';

interface AppState extends AuthState {
  // Estado UI
  selectedDate: string;

  // Utilidades
  setSelectedDate: (date: string) => void;
  loadFromSupabase: () => Promise<void>;

  // Auth
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const today = getVenezuelaDate();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Estado UI
      selectedDate: today,

      // Estado Auth
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      setSelectedDate: (date) => set({ selectedDate: date }),

      // Auth methods
      setUser: (user) => {
        console.log('useAppStore - setUser called', { user, isAuthenticated: !!user });
        set({ user, isAuthenticated: !!user });
      },
      setSession: (session) => {
        console.log('useAppStore - setSession called', { session });
        set({ session });
      },
      setLoading: (isLoading) => {
        console.log('useAppStore - setLoading called', { isLoading });
        set({ isLoading });
      },

      signIn: async (emailOrUsername, password) => {
        try {
          set({ isLoading: true });

          let email = emailOrUsername;

          // Si no contiene @, buscar username en user_profiles
          if (!emailOrUsername.includes('@')) {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('email')
              .eq('username', emailOrUsername)
              .single();

            if (profileError || !profile) {
              throw new Error('Usuario no encontrado');
            }

            email = profile.email;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles_with_company')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) throw profileError;

            const userProfile: UserProfile = {
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              role: profileData.role,
              fullName: profileData.full_name,
              companyId: profileData.company_id,
              company: profileData.company_id ? {
                id: profileData.company_id,
                name: profileData.company_name,
                rif: profileData.company_rif,
                address: profileData.address,
                phone: profileData.phone,
                isActive: profileData.company_is_active,
                createdAt: profileData.created_at,
                updatedAt: profileData.updated_at,
              } : undefined,
              createdBy: profileData.created_by,
              createdAt: profileData.created_at,
              updatedAt: profileData.updated_at,
            };

            set({
              user: userProfile,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/login`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) throw error;

          // La redirección se maneja automáticamente por Supabase
          // El perfil se cargará cuando regrese de Google OAuth
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },

      checkSession: async () => {
        try {
          set({ isLoading: true });

          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          console.log('useAppStore - checkSession result', { session, error });

          if (error) throw error;

          if (session?.user) {
            console.log('useAppStore - Session found, loading profile for user:', session.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles_with_company')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            const userProfile: UserProfile = {
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              role: profileData.role,
              fullName: profileData.full_name,
              companyId: profileData.company_id,
              company: profileData.company_id ? {
                id: profileData.company_id,
                name: profileData.company_name,
                rif: profileData.company_rif,
                address: profileData.address,
                phone: profileData.phone,
                isActive: profileData.company_is_active,
                createdAt: profileData.created_at,
                updatedAt: profileData.updated_at,
              } : undefined,
              createdBy: profileData.created_by,
              createdAt: profileData.created_at,
              updatedAt: profileData.updated_at,
            };

            set({
              user: userProfile,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error checking session:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Load data from Supabase - Optimizado para cargar solo datos necesarios
      loadFromSupabase: async () => {
        try {
          const [
            customersRes,
            productsRes,
            prepaidRes,
            literPricingRes,
            exchangeRatesRes,
            balanceTransactionsRes,
            salesRes,
          ] = await Promise.all([
            supabase.from('customers').select('*'),
            supabase.from('products').select('*'),
            supabase.from('prepaid_orders').select('*'),
            supabase.from('liter_pricing').select('*'),
            supabase.from('exchange_rates').select('*'),
            supabase
              .from('payment_balance_transactions')
              .select('*')
              .order('created_at', { ascending: false }),
            supabase
              .from('sales')
              .select('*')
              .limit(100)
              .order('date', { ascending: false }),
          ]);

          const customers = customersRes.data || [];
          const products = (productsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            defaultPrice: Number(p.default_price),
            requiresLiters: p.requires_liters,
            minLiters: p.minLiters,
            maxLiters: p.max_liters,
            icon: p.icon,
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

          const sales = (salesRes.data || []).map((s: any) => ({
            id: s.id,
            dailyNumber: s.daily_number,
            date: s.date,
            items: s.items,
            paymentMethod: s.payment_method,
            totalBs: Number(s.total_bs),
            totalUsd: Number(s.total_usd),
            exchangeRate: Number(s.exchange_rate),
            notes: s.notes,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));

          const configStore = useConfigStore.getState();
          let latestExchangeRate = configStore.config.exchangeRate;
          let exchangeHistory: ExchangeRateHistory[] =
            configStore.config.exchangeRateHistory;

          if (exchangeRatesRes.data) {
            const mappedHistory = exchangeRatesRes.data.map((x: any) => ({
              date: x.date,
              rate: Number(x.rate),
              updatedAt: x.updated_at ?? x.updatedAt,
            }));

            mappedHistory.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            exchangeHistory = mappedHistory;
            if (exchangeHistory.length > 0) {
              latestExchangeRate = exchangeHistory[0].rate;
            }
          }

          useCustomerStore.getState().setCustomers(customers);
          useWaterSalesStore.getState().setSales(sales);
          usePrepaidStore.getState().setPrepaidOrders(prepaid);
          configStore.setConfigData(
            {
              literPricing: literPricing.length
                ? literPricing
                : configStore.config.literPricing,
              exchangeRateHistory: exchangeHistory,
              exchangeRate: latestExchangeRate,
              lastUpdated: new Date().toISOString(),
            },
            products.length ? products : defaultProducts
          );

          useExpenseStore.getState().setExpensesData([]);
          usePaymentBalanceStore
            .getState()
            .setPaymentBalanceData(paymentBalanceTransactions);
        } catch (err) {
          console.error('Error loading from Supabase', err);
        }
      },
    }),
    {
      name: 'aquagest-core-storage',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.selectedDate = getVenezuelaDate();
          state.isLoading = false;
        }
      },
    }
  )
);

try {
  useAppStore.getState().loadFromSupabase &&
    useAppStore.getState().loadFromSupabase();
} catch (err) {
  // ignore
}
