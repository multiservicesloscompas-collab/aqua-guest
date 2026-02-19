import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, UserProfile } from '@/types/auth';
import supabase from '@/lib/supabaseClient';

interface AuthStore extends AuthState {
  setUser: (user: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (isLoading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setSession: (session) =>
        set({
          session,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
        }),

      signIn: async (email, password) => {
        try {
          set({ isLoading: true });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) throw profileError;

            const userProfile: UserProfile = {
              id: profileData.id,
              email: profileData.email,
              role: profileData.role,
              fullName: profileData.full_name,
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

          if (error) throw error;

          if (session?.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
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
              role: profileData.role,
              fullName: profileData.full_name,
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
