import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import supabase from '@/lib/supabaseClient';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkSession, setUser, setSession, setLoading, user } = useAuthStore();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let isInitialCheckComplete = false;

    checkSession().finally(() => {
      isInitialCheckComplete = true;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      if (event === 'INITIAL_SESSION' || !isInitialCheckComplete) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user && userRef.current?.id === session.user.id) {
        return;
      }

      setLoading(true);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profileData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          if (profileData) {
            setUser({
              id: profileData.id,
              email: profileData.email,
              role: profileData.role,
              fullName: profileData.full_name,
              createdAt: profileData.created_at,
              updatedAt: profileData.updated_at,
            });
            setSession(session);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
          setSession(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, setUser, setSession, setLoading]);

  return children;
};
