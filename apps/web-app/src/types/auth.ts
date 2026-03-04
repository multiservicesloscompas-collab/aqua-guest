export type UserRole = 'admin' | 'client' | 'employee';

export const UserRoleLabels: Record<UserRole, string> = {
  admin: 'Administrador', // Super Admin del sistema
  client: 'Cliente', // Admin de compañía
  employee: 'Empleado', // Empleado de compañía
};

export interface Company {
  id: string;
  name: string;
  rif: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  companyId?: string; // NULL para admin (super admin), requerido para client y employee
  company?: Company; // Información de la compañía (solo para client y employee)
  createdBy?: string; // UUID del usuario que lo creó
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
