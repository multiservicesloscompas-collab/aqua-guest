import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

/**
 * Página de callback para Google OAuth
 * Maneja la redirección después de autenticarse con Google
 */
export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const checkSession = useAppStore((state) => state.checkSession);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth callback...');
        await checkSession();
        console.log('[AuthCallback] Session checked, redirecting to home');
        navigate('/');
      } catch (error) {
        console.error('[AuthCallback] Error processing callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [checkSession, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completando inicio de sesión...</p>
      </div>
    </div>
  );
};
