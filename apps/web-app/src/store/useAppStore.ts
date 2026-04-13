import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  centralClient, 
  getTenantClient, 
  initTenantClient, 
  clearTenantClient 
} from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';
import { ExchangeRateHistory } from '@/types';
import { AuthState, UserProfile, CentralUserProfile, TenantCredentials } from '@/types/auth';
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
          console.log('🔐 useAppStore - signIn called', { emailOrUsername });

          let email = emailOrUsername;

          // Si no contiene @, buscar username en BD Central
          if (!emailOrUsername.includes('@')) {
            console.log('🔍 Buscando username en BD Central:', emailOrUsername);
            const { data: profile, error: profileError } = await centralClient
              .from('tenant_users')
              .select('email')
              .eq('username', emailOrUsername)
              .single();

            if (profileError || !profile) {
              console.error('❌ Usuario no encontrado:', profileError);
              throw new Error('Usuario no encontrado');
            }

            email = profile.email;
            console.log('✅ Email encontrado:', email);
          }

          // 1. Autenticar en BD Central
          console.log('🔑 Autenticando en BD Central...');
          const { data, error } = await centralClient.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('❌ Error de autenticación:', error);
            throw error;
          }

          console.log('✅ Autenticado en BD Central', { userId: data.user?.id });

          if (data.user) {
            // 2. Obtener perfil del usuario de BD Central
            console.log('📋 Obteniendo perfil de BD Central...');
            const { data: centralProfile, error: profileError } = await centralClient
              .from('tenant_users')
              .select(`
                *,
                tenant:tenants(*)
              `)
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('❌ Error obteniendo perfil:', profileError);
              throw profileError;
            }

            console.log('✅ Perfil obtenido:', { role: centralProfile.role, tenantId: centralProfile.tenant_id });

            const centralUserProfile = centralProfile as CentralUserProfile & { tenant?: any };

            // 3. Si el usuario tiene tenant, obtener credenciales e inicializar cliente
            if (centralUserProfile.tenant_id) {
              console.log('🏢 Usuario tiene tenant, obteniendo credenciales...');
              const { data: credentials, error: credError } = await centralClient
                .from('tenant_credentials')
                .select('supabase_url, supabase_anon_key')
                .eq('tenant_id', centralUserProfile.tenant_id)
                .single();

              if (credError) {
                console.error('❌ Error obteniendo credenciales del tenant:', credError);
                throw credError;
              }

              console.log('✅ Credenciales del tenant obtenidas');

              const tenantCreds = credentials as TenantCredentials;

              // 4. Inicializar cliente del tenant
              console.log('🔧 Inicializando cliente del tenant...');
              initTenantClient(tenantCreds.supabase_url, tenantCreds.supabase_anon_key);

              // 5. Obtener perfil del usuario en BD del tenant
              console.log('👤 Obteniendo perfil del tenant...');
              const tenantClient = getTenantClient();
              const { data: tenantProfile, error: tenantProfileError } = await tenantClient
                .from('user_profiles_with_company')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (tenantProfileError) {
                console.warn('⚠️ No se encontró perfil en BD del tenant:', tenantProfileError);
              } else {
                console.log('✅ Perfil del tenant obtenido:', { role: tenantProfile.role, companyId: tenantProfile.company_id });
              }

              // 6. Combinar datos de ambas BDs
              const userProfile: UserProfile = {
                id: centralUserProfile.id,
                email: centralUserProfile.email,
                username: centralUserProfile.username || undefined,
                role: centralUserProfile.role,
                fullName: centralUserProfile.full_name || undefined,
                tenantId: centralUserProfile.tenant_id,
                companyId: tenantProfile?.company_id,
                company: tenantProfile?.company_id ? {
                  id: tenantProfile.company_id,
                  name: tenantProfile.company_name,
                  rif: tenantProfile.company_rif,
                  address: tenantProfile.address,
                  phone: tenantProfile.phone,
                  isActive: tenantProfile.company_is_active,
                  createdAt: tenantProfile.created_at,
                  updatedAt: tenantProfile.updated_at,
                } : undefined,
                createdBy: centralUserProfile.created_by || undefined,
                createdAt: centralUserProfile.created_at,
                updatedAt: centralUserProfile.updated_at,
              };

              console.log('✅ Login exitoso - Usuario con tenant:', userProfile);
              set({
                user: userProfile,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Usuario admin sin tenant - solo usa BD Central
              console.log('✅ Login exitoso - Usuario admin sin tenant');
              const userProfile: UserProfile = {
                id: centralUserProfile.id,
                email: centralUserProfile.email,
                username: centralUserProfile.username || undefined,
                role: centralUserProfile.role,
                fullName: centralUserProfile.full_name || undefined,
                tenantId: null,
                createdBy: centralUserProfile.created_by || undefined,
                createdAt: centralUserProfile.created_at,
                updatedAt: centralUserProfile.updated_at,
              };

              set({
                user: userProfile,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });

          const { error } = await centralClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) throw error;

          // La redirección se maneja automáticamente por Supabase
          // El perfil se cargará en checkSession cuando regrese de Google OAuth
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          // Cerrar sesión en BD Central
          const { error } = await centralClient.auth.signOut();
          if (error) throw error;

          // Limpiar cliente del tenant
          clearTenantClient();

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

          // Verificar sesión en BD Central
          const {
            data: { session },
            error,
          } = await centralClient.auth.getSession();

          console.log('🔍 useAppStore - checkSession result', { session, error });

          if (error) throw error;

          if (session?.user) {
            console.log('✅ useAppStore - Session found, loading profile for user:', session.user.id);
            console.log('📧 User email:', session.user.email);

            // Obtener perfil de BD Central
            const { data: centralProfile, error: profileError } = await centralClient
              .from('tenant_users')
              .select(`
                *,
                tenant:tenants(*)
              `)
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('❌ Error loading central profile:', profileError);
              console.log('⚠️ Usuario no existe en tenant_users. Necesita ser creado.');
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            console.log('✅ Central profile loaded:', centralProfile);

            const centralUserProfile = centralProfile as CentralUserProfile & { tenant?: any };

            // Si tiene tenant, inicializar cliente y obtener perfil
            if (centralUserProfile.tenant_id) {
              const { data: credentials } = await centralClient
                .from('tenant_credentials')
                .select('supabase_url, supabase_anon_key')
                .eq('tenant_id', centralUserProfile.tenant_id)
                .single();

              if (credentials) {
                const tenantCreds = credentials as TenantCredentials;
                initTenantClient(tenantCreds.supabase_url, tenantCreds.supabase_anon_key);

                const tenantClient = getTenantClient();
                const { data: tenantProfile } = await tenantClient
                  .from('user_profiles_with_company')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                const userProfile: UserProfile = {
                  id: centralUserProfile.id,
                  email: centralUserProfile.email,
                  username: centralUserProfile.username || undefined,
                  role: centralUserProfile.role,
                  fullName: centralUserProfile.full_name || undefined,
                  tenantId: centralUserProfile.tenant_id,
                  companyId: tenantProfile?.company_id,
                  company: tenantProfile?.company_id ? {
                    id: tenantProfile.company_id,
                    name: tenantProfile.company_name,
                    rif: tenantProfile.company_rif,
                    address: tenantProfile.address,
                    phone: tenantProfile.phone,
                    isActive: tenantProfile.company_is_active,
                    createdAt: tenantProfile.created_at,
                    updatedAt: tenantProfile.updated_at,
                  } : undefined,
                  createdBy: centralUserProfile.created_by || undefined,
                  createdAt: centralUserProfile.created_at,
                  updatedAt: centralUserProfile.updated_at,
                };

                set({
                  user: userProfile,
                  session,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            } else {
              // Admin sin tenant
              const userProfile: UserProfile = {
                id: centralUserProfile.id,
                email: centralUserProfile.email,
                username: centralUserProfile.username || undefined,
                role: centralUserProfile.role,
                fullName: centralUserProfile.full_name || undefined,
                tenantId: null,
                createdBy: centralUserProfile.created_by || undefined,
                createdAt: centralUserProfile.created_at,
                updatedAt: centralUserProfile.updated_at,
              };

              set({
                user: userProfile,
                session,
                isAuthenticated: true,
                isLoading: false,
              });
            }
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
          const supabase = getTenantClient();
          
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
