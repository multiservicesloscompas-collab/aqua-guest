import { useAuthStore } from '@/store/useAuthStore';

export const useAuth = () => {
  const { user, session, isLoading, isAuthenticated } = useAuthStore();

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
  };
};
