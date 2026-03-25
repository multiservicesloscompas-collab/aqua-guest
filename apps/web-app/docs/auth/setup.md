# Configuración de Autenticación en Supabase

Este documento describe los pasos necesarios para configurar la autenticación con roles y compañías en Supabase.

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
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Clients y employees solo pueden ver su propia compañía
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Política: Solo admins pueden crear compañías
CREATE POLICY "Only admins can create companies"
  ON companies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar compañías
CREATE POLICY "Only admins can update companies"
  ON companies FOR UPDATE
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

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can read company profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = user_profiles.company_id
    )
  );

-- Políticas de creación
CREATE POLICY "Admins can create clients"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can create employees"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = company_id
      AND role = 'employee'
    )
  );

-- Políticas de actualización
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can update employees"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'client'
      AND up.company_id = user_profiles.company_id
      AND user_profiles.role = 'employee'
    )
  );

-- Índices
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_created_by ON user_profiles(created_by);
```

Ver [`setup-functions.md`](./setup-functions.md) para funciones y triggers adicionales.
Ver [`setup-test-users.md`](./setup-test-users.md) para crear usuarios de prueba.
