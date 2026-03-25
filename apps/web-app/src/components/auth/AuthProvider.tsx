import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStateListener } from '@/hooks/useAuthStateListener';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor de autenticación
 * Responsabilidad: Inicializar la sesión y coordinar los listeners de autenticación
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkSession } = useAppStore();

  // Delegar la escucha de cambios de estado a un hook especializado
  useAuthStateListener();

  // Verificar sesión inicial al montar el componente
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return children;
};
