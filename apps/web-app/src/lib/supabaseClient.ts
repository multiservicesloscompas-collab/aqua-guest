import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CLIENTE CENTRAL (Agua-Guest)
// Para autenticación y gestión de tenants
// ============================================
const centralUrl = import.meta.env.VITE_CENTRAL_SUPABASE_URL as string;
const centralAnonKey = import.meta.env.VITE_CENTRAL_SUPABASE_ANON_KEY as string;

if (!centralUrl || !centralAnonKey) {
  console.error('Missing central Supabase credentials');
}

export const centralClient = createClient(centralUrl, centralAnonKey);

// ============================================
// CLIENTE TENANT (Dinámico)
// Se inicializa después del login con credenciales del tenant
// ============================================
let tenantClientInstance: SupabaseClient | null = null;

// Inicializar cliente del tenant con credenciales dinámicas
export const initTenantClient = (url: string, anonKey: string): SupabaseClient => {
  console.log('[Supabase] Initializing tenant client:', { url });
  tenantClientInstance = createClient(url, anonKey);
  return tenantClientInstance;
};

// Obtener cliente del tenant (lanza error si no está inicializado)
export const getTenantClient = (): SupabaseClient => {
  if (!tenantClientInstance) {
    // Fallback: usar credenciales por defecto para desarrollo
    const defaultUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    
    if (defaultUrl && defaultKey) {
      console.warn('[Supabase] Tenant client not initialized, using default credentials');
      tenantClientInstance = createClient(defaultUrl, defaultKey);
      return tenantClientInstance;
    }
    
    throw new Error('Tenant client not initialized. Please login first.');
  }
  return tenantClientInstance;
};

// Verificar si el tenant client está inicializado
export const isTenantClientInitialized = (): boolean => {
  return tenantClientInstance !== null;
};

// Limpiar cliente del tenant (útil para logout)
export const clearTenantClient = (): void => {
  console.log('[Supabase] Clearing tenant client');
  tenantClientInstance = null;
};

// ============================================
// EXPORTACIONES PARA COMPATIBILIDAD
// ============================================
// Para compatibilidad con código existente que importa 'supabase'
// Ahora apunta a getTenantClient() que se inicializa dinámicamente
export const supabase = getTenantClient();
export default getTenantClient;
