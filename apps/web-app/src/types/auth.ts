import { Session } from '@supabase/supabase-js';

// Roles unificados: admin, owner, employee
export type UserRole = 'admin' | 'owner' | 'employee';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador', // Super Admin del sistema
  owner: 'Dueño', // Admin de compañía
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
  // Datos de BD Central
  id: string;
  email: string;
  username?: string;
  role: UserRole; // Rol mapeado para frontend (admin, client, employee)
  fullName?: string;
  tenantId?: string | null; // ID del tenant (NULL para admin)
  
  // Datos de BD Tenant (solo para client/employee)
  companyId?: string; // ID de la compañía en BD del tenant
  company?: Company; // Información de la compañía
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Perfil de usuario en BD Central
export interface CentralUserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole; // admin, owner, employee
  tenant_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Credenciales del tenant
export interface TenantCredentials {
  tenant_id: string;
  supabase_url: string;
  supabase_anon_key: string;
}

// Información del tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  supabase_project_id: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
