# Funciones y Triggers de Supabase

## Función para actualizar `updated_at`

```sql
-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Función de validación de jerarquía

```sql
-- Función para validar jerarquía de usuarios
CREATE OR REPLACE FUNCTION validate_user_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Admin (super admin) no debe tener company_id
  IF NEW.role = 'admin' AND NEW.company_id IS NOT NULL THEN
    RAISE EXCEPTION 'Admin (super admin) cannot be associated with a company';
  END IF;

  -- Client y employee DEBEN tener company_id
  IF NEW.role IN ('client', 'employee') AND NEW.company_id IS NULL THEN
    RAISE EXCEPTION '% must be associated with a company', NEW.role;
  END IF;

  -- Validar que la compañía existe y está activa
  IF NEW.company_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM companies
      WHERE id = NEW.company_id AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Company does not exist or is not active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER validate_user_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_hierarchy();
```

## Vista para información completa de usuarios

```sql
-- Vista para consultas optimizadas con información de compañía
CREATE OR REPLACE VIEW user_profiles_with_company AS
SELECT
  up.id,
  up.email,
  up.role,
  up.full_name,
  up.company_id,
  c.name as company_name,
  c.rif as company_rif,
  c.address,
  c.phone,
  c.is_active as company_is_active,
  up.created_by,
  creator.full_name as created_by_name,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
LEFT JOIN user_profiles creator ON up.created_by = creator.id;
```

## Función para auto-crear perfil (opcional)

Si quieres que se cree automáticamente un perfil cuando un usuario se registra:

```sql
-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'client', -- Rol por defecto
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Variables de Entorno

Asegúrate de tener configuradas en tu archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Notas Importantes

1. **Seguridad**: Nunca expongas la `service_role_key` en el frontend
2. **RLS**: Siempre habilita Row Level Security en todas las tablas sensibles
3. **Testing**: Prueba cada rol para asegurar que los permisos funcionan correctamente
4. **Email Confirmation**: Considera habilitar/deshabilitar la confirmación de email según tus necesidades en Authentication > Settings
