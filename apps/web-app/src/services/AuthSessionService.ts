import { getTenantClient } from '@/lib/supabaseClient';
import { UserProfile } from '@/types/auth';

interface ProfileDataFromDB {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'employee';
  full_name?: string;
  company_id?: string;
  company_name: string;
  company_rif: string;
  address?: string;
  phone?: string;
  company_is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Servicio para manejar la lógica de sesión de autenticación
 * Responsabilidad: Cargar y transformar datos de perfil de usuario
 */
export class AuthSessionService {
  /**
   * Carga el perfil completo del usuario desde la base de datos
   */
  static async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = getTenantClient();
      const { data: profileData, error } = await supabase
        .from('user_profiles_with_company')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!profileData) return null;

      return this.transformProfileData(profileData as ProfileDataFromDB);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  /**
   * Transforma los datos del perfil de la base de datos al formato de la aplicación
   */
  private static transformProfileData(profileData: ProfileDataFromDB): UserProfile {
    return {
      id: profileData.id,
      email: profileData.email,
      role: profileData.role,
      fullName: profileData.full_name,
      companyId: profileData.company_id,
      company: profileData.company_id && profileData.company_name && profileData.company_rif ? {
        id: profileData.company_id,
        name: profileData.company_name,
        rif: profileData.company_rif,
        address: profileData.address,
        phone: profileData.phone,
        isActive: profileData.company_is_active,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      } : undefined,
      createdBy: profileData.created_by,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };
  }

  /**
   * Verifica si el usuario actual es el mismo que el de la sesión
   */
  static isSameUser(currentUserId: string | undefined, sessionUserId: string): boolean {
    return currentUserId === sessionUserId;
  }
}
