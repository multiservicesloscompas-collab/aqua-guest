export type UserRole = 'admin' | 'client' | 'employee';

export const UserRoleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  client: 'Cliente',
  employee: 'Empleado',
};

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
