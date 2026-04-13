import { useEffect, useRef } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { centralClient } from '@/lib/supabaseClient';
import { useAppStore } from '@/store/useAppStore';
import { AuthSessionService } from '@/services/AuthSessionService';

/**
 * Hook personalizado para escuchar cambios en el estado de autenticación
 * Responsabilidad: Gestionar la suscripción a eventos de autenticación de Supabase
 */
export const useAuthStateListener = () => {
  const { setUser, setSession, setLoading, user } = useAppStore();
  const userRef = useRef(user);
  const isInitialCheckCompleteRef = useRef(false);

  // Mantener referencia actualizada del usuario
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
      console.log('useAuthStateListener - Auth state change', { event, hasSession: !!session, isInitialCheckComplete: isInitialCheckCompleteRef.current });
      
      // Para INITIAL_SESSION, procesar solo si ya se completó la verificación inicial
      // Esto permite detectar sesiones de Google OAuth cuando regresas
      if (event === 'INITIAL_SESSION') {
        if (!isInitialCheckCompleteRef.current) {
          console.log('useAuthStateListener - Skipping INITIAL_SESSION (first load)');
          return;
        }
        console.log('useAuthStateListener - Processing INITIAL_SESSION (after initial check)');
      }

      // Evitar recargar si el usuario ya está autenticado con la misma sesión
      if (event === 'SIGNED_IN' && session?.user && AuthSessionService.isSameUser(userRef.current?.id, session.user.id)) {
        console.log('useAuthStateListener - Skipping SIGNED_IN (same user)');
        return;
      }

      setLoading(true);

      try {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log('useAuthStateListener - Processing sign in event');
          await handleSignIn(session);
          // checkSession ya maneja setLoading(false) internamente
        } else if (event === 'SIGNED_OUT') {
          console.log('useAuthStateListener - Processing sign out event');
          handleSignOut();
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('useAuthStateListener - Processing token refresh');
          setSession(session);
          setLoading(false);
        } else {
          console.log('useAuthStateListener - No session found, clearing state');
          handleSignOut();
          setLoading(false);
        }
      } catch (error) {
        console.error('useAuthStateListener - Error handling auth state change:', error);
        setLoading(false);
      }
    };

    const handleSignIn = async (session: Session) => {
      console.log('useAuthStateListener - handleSignIn called', { userId: session.user.id });
      // Usar checkSession del store que maneja correctamente admin y owner
      const checkSession = useAppStore.getState().checkSession;
      await checkSession();
      console.log('useAuthStateListener - Session checked via store');
    };

    const handleSignOut = () => {
      setUser(null);
      setSession(null);
    };

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = centralClient.auth.onAuthStateChange(handleAuthStateChange);

    // Marcar que la verificación inicial está completa
    isInitialCheckCompleteRef.current = true;

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);
};
