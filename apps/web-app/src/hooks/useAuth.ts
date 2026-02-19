import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import supabase from '@/lib/supabaseClient';

export const useAuth = () => {
  const { user, session, isLoading, isAuthenticated, checkSession, setUser, setSession } = useAuthStore();

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

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
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession, setUser, setSession]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
  };
};
