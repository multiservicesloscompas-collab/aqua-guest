import { getTenantClient } from '@/lib/supabaseClient';
import { UserProfile, UserRole, Company } from '@/types/auth';

export interface CreateUserData {
  email: string;
  username?: string;
  password: string;
  fullName?: string;
  role: 'owner' | 'employee';
  companyId?: string;
  companyData?: {
    name: string;
    rif: string;
    address?: string;
    phone?: string;
  };
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  fullName?: string;
  role?: UserRole;
  companyId?: string;
}

export interface UserFilters {
  role?: UserRole;
  companyId?: string;
  isActive?: boolean;
}

/**
 * Servicio para gestión de usuarios
 * Maneja la creación, actualización, eliminación y listado de usuarios
 */
class UserManagementService {
  /**
   * Lista usuarios según los filtros y permisos del usuario actual
   */
  async listUsers(currentUser: UserProfile, filters?: UserFilters): Promise<UserProfile[]> {
    try {
      const supabase = getTenantClient();
      let query = supabase
        .from('user_profiles_with_company')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar según el rol del usuario actual
      if (currentUser.role === 'owner') {
        // Owner solo ve empleados de su empresa
        query = query
          .eq('company_id', currentUser.companyId!)
          .eq('role', 'employee');
      } else if (currentUser.role === 'employee') {
        // Empleado no debería tener acceso
        throw new Error('No tienes permisos para ver usuarios');
      }
      // Admin ve todos los usuarios (sin filtro adicional)

      // Aplicar filtros adicionales
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        fullName: u.full_name,
        companyId: u.company_id,
        company: u.company_id ? {
          id: u.company_id,
          name: u.company_name,
          rif: u.company_rif,
          address: u.address,
          phone: u.phone,
          isActive: u.company_is_active,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        } : undefined,
        createdBy: u.created_by,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      }));
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = getTenantClient();
      const { data, error } = await supabase
        .from('user_profiles_with_company')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role,
        fullName: data.full_name,
        companyId: data.company_id,
        company: data.company_id ? {
          id: data.company_id,
          name: data.company_name,
          rif: data.company_rif,
          address: data.address,
          phone: data.phone,
          isActive: data.company_is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        } : undefined,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<void> {
    try {
      const supabase = getTenantClient();
      const updateData: any = {};

      if (userData.email) updateData.email = userData.email;
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.fullName !== undefined) updateData.full_name = userData.fullName;
      if (userData.role) updateData.role = userData.role;
      if (userData.companyId !== undefined) updateData.company_id = userData.companyId;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Desactiva un usuario (soft delete)
   * Nota: Esto requeriría agregar un campo is_active a user_profiles
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      // Por ahora, esto es un placeholder
      // En el futuro, se podría implementar con un campo is_active
      throw new Error('Deactivate user not implemented yet');
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Lista todas las compañías (solo para admin)
   */
  async listCompanies(): Promise<Company[]> {
    try {
      const supabase = getTenantClient();
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        rif: c.rif,
        address: c.address,
        phone: c.phone,
        isActive: c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    } catch (error) {
      console.error('Error listing companies:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva compañía (solo para admin)
   */
  async createCompany(companyData: {
    name: string;
    rif: string;
    address?: string;
    phone?: string;
  }): Promise<Company> {
    try {
      const supabase = getTenantClient();
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          rif: companyData.rif,
          address: companyData.address,
          phone: companyData.phone,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        rif: data.rif,
        address: data.address,
        phone: data.phone,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Valida que el username sea único
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const supabase = getTenantClient();
      let query = supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }

  /**
   * Valida que el email sea único
   */
  async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const supabase = getTenantClient();
      let query = supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking email availability:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();
