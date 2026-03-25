import { useAppStore } from '@/store/useAppStore';

export const useAuth = () => {
  const { user, session, isLoading, isAuthenticated } = useAppStore();

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
  };
};
