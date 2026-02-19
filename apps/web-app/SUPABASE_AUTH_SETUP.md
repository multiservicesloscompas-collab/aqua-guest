# Configuración de Autenticación en Supabase

Este documento describe los pasos necesarios para configurar la autenticación con roles en Supabase.

## 1. Crear la tabla `user_profiles`

Ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'employee')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para que los admins puedan leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para que los admins puedan actualizar perfiles
CREATE POLICY "Admins can update profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para que los admins puedan insertar perfiles
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
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

## 3. Crear función para auto-crear perfil al registrarse (opcional)

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

## 4. Crear usuarios de prueba

### Usuario Admin
```sql
-- Primero crea el usuario en Authentication > Users en el dashboard de Supabase
-- Luego inserta el perfil manualmente:
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'admin@aquagest.com',
  'admin',
  'Administrador'
);
```

### Usuario Employee
```sql
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'empleado@aquagest.com',
  'employee',
  'Empleado'
);
```

### Usuario Client
```sql
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
  'UUID_DEL_USUARIO_CREADO',
  'cliente@aquagest.com',
  'client',
  'Cliente'
);
```

## 5. Configurar políticas RLS para tablas existentes

Para restringir el acceso a las tablas existentes según el rol:

```sql
-- Ejemplo: Solo admins y employees pueden ver ventas
CREATE POLICY "Only admins and employees can view sales"
  ON sales
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'employee')
    )
  );

-- Ejemplo: Solo admins pueden modificar configuración
CREATE POLICY "Only admins can modify config"
  ON exchange_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Ejemplo: Clientes solo pueden ver sus propios pedidos prepagados
CREATE POLICY "Clients can view own prepaid orders"
  ON prepaid_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.role IN ('admin', 'employee')
        OR (up.role = 'client' AND prepaid_orders.customer_phone = up.email)
      )
    )
  );
```

## 6. Permisos recomendados por rol

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios
- Configuración del sistema
- Reportes y estadísticas

### Employee
- Crear y gestionar ventas
- Gestionar alquileres
- Gestionar egresos
- Ver reportes básicos
- NO puede modificar configuración del sistema

### Client
- Ver sus propios pedidos prepagados
- Ver historial de alquileres (si aplica)
- Acceso limitado solo a lectura

## 7. Variables de entorno

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
