import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import supabase from '@/lib/supabaseClient';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkSession, setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  return <>{children}</>;
};
