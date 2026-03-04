# Configuración de Autenticación en Supabase

Este documento describe los pasos necesarios para configurar la autenticación con roles y compañías en Supabase.

## Estructura de Roles

- **admin**: Super administrador del sistema (sin compañía)
- **client**: Administrador de compañía (gestiona su compañía y crea empleados)
- **employee**: Empleado de compañía (acceso limitado)

## 1. Crear la tabla `companies`

Ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de compañías
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rif TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política: Admins (super admin) pueden ver todas las compañías
CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Clients y employees solo pueden ver su propia compañía
CREATE POLICY "Users can view own company"
  ON companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Política: Solo admins pueden crear compañías
CREATE POLICY "Only admins can create companies"
  ON companies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar compañías
CREATE POLICY "Only admins can update companies"
  ON companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Índices para mejorar rendimiento
CREATE INDEX idx_companies_rif ON companies(rif);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 2. Crear la tabla `user_profiles`

Ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'employee')),
  full_name TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON COLUMN user_profiles.role IS 'admin = super admin (sin compañía), client = admin de compañía, employee = empleado de compañía';
COMMENT ON COLUMN user_profiles.company_id IS 'NULL para admin (super admin), requerido para client y employee';
COMMENT ON COLUMN user_profiles.created_by IS 'UUID del usuario que creó este perfil (auditoría)';

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Admins (super admin) pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Clients pueden leer perfiles de su compañía
CREATE POLICY "Clients can read company profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = user_profiles.company_id
    )
  );

-- Política: Admins pueden crear clients (con compañía)
CREATE POLICY "Admins can create clients"
  ON user_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Clients pueden crear employees de su compañía
CREATE POLICY "Clients can create employees"
  ON user_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = company_id
      AND role = 'employee'
    )
  );

-- Política: Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Clients pueden actualizar employees de su compañía
CREATE POLICY "Clients can update employees"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = user_profiles.company_id
      AND user_profiles.role = 'employee'
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_created_by ON user_profiles(created_by);
```

## 2. Crear función trigger para actualizar `updated_at`

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

## 3. Crear función de validación de jerarquía

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

## 4. Crear vista para información completa de usuarios

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

## 5. Crear función para auto-crear perfil al registrarse (opcional)

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

## 6. Crear usuarios de prueba

### Paso 1: Crear Super Admin (rol: admin)

```sql
-- Primero crea el usuario en Authentication > Users en el dashboard de Supabase
-- Email: admin@aquagest.com
-- Luego inserta el perfil (sin company_id):
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'admin@aquagest.com',
  'admin',
  'Super Administrador'
);
```

### Paso 2: Crear una Compañía

```sql
INSERT INTO companies (name, rif, address, phone)
VALUES (
  'Empresa Demo',
  'J-12345678-9',
  'Av. Principal, Caracas',
  '+58 412 1234567'
);
```

### Paso 3: Crear Admin de Compañía (rol: client)

```sql
-- Primero crea el usuario en Authentication > Users
-- Email: cliente@aquagest.com
-- Luego inserta el perfil (con company_id):
INSERT INTO user_profiles (id, email, role, full_name, company_id, created_by)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'cliente@aquagest.com',
  'client',
  'Admin de Empresa Demo',
  (SELECT id FROM companies WHERE rif = 'J-12345678-9'),
  (SELECT id FROM user_profiles WHERE email = 'admin@aquagest.com')
);
```

### Paso 4: Crear Empleado (rol: employee)

```sql
-- Primero crea el usuario en Authentication > Users
-- Email: empleado@aquagest.com
-- Luego inserta el perfil (con company_id):
INSERT INTO user_profiles (id, email, role, full_name, company_id, created_by)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'empleado@aquagest.com',
  'employee',
  'Empleado de Empresa Demo',
  (SELECT id FROM companies WHERE rif = 'J-12345678-9'),
  (SELECT id FROM user_profiles WHERE email = 'cliente@aquagest.com')
);
```

## 7. Permisos recomendados por rol

### Admin (Super Admin del Sistema)

- Acceso completo a todas las funcionalidades
- Crear y gestionar compañías
- Crear usuarios tipo "client" (admins de compañía)
- Ver todas las compañías y sus datos
- Configuración global del sistema
- Reportes y estadísticas de todas las compañías
- **NO está asociado a ninguna compañía**

### Client (Admin de Compañía)

- Acceso completo a su compañía
- Crear usuarios tipo "employee" (empleados de su compañía)
- Gestionar ventas, alquileres, egresos
- Ver todas las métricas y reportes de su compañía
- Configuración de su compañía
- **Solo ve datos de su compañía**

### Employee (Empleado de Compañía)

- Crear y gestionar ventas
- Gestionar alquileres
- Gestionar egresos
- Ver reportes básicos
- **NO puede ver métricas completas**
- **NO puede modificar configuración**
- **NO puede crear usuarios**
- **Solo ve datos de su compañía**

## 8. Variables de entorno

Asegúrate de tener configuradas en tu archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 8. Notas importantes

1. **Seguridad**: Nunca expongas la `service_role_key` en el frontend
2. **RLS**: Siempre habilita Row Level Security en todas las tablas sensibles
3. **Testing**: Prueba cada rol para asegurar que los permisos funcionan correctamente
4. **Email Confirmation**: Considera habilitar/deshabilitar la confirmación de email según tus necesidades en Authentication > Settings
