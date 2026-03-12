# Crear Usuarios de Prueba

## Paso 1: Crear Super Admin (rol: admin)

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

## Paso 2: Crear una Compañía

```sql
INSERT INTO companies (name, rif, address, phone)
VALUES (
  'Empresa Demo',
  'J-12345678-9',
  'Av. Principal, Caracas',
  '+58 412 1234567'
);
```

## Paso 3: Crear Admin de Compañía (rol: client)

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

## Paso 4: Crear Empleado (rol: employee)

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

## Usuarios de Prueba Recomendados

| Email                 | Rol      | Password      | Compañía     |
| --------------------- | -------- | ------------- | ------------ |
| admin@aquagest.com    | admin    | (tu password) | N/A          |
| cliente@aquagest.com  | client   | (tu password) | Empresa Demo |
| empleado@aquagest.com | employee | (tu password) | Empresa Demo |

## Escenarios de Prueba

1. **Login con credenciales válidas** → Debe redirigir a dashboard
2. **Login con credenciales inválidas** → Debe mostrar error
3. **Acceso a ruta protegida sin auth** → Debe redirigir a login
4. **Acceso a ruta con rol incorrecto** → Debe mostrar "Acceso Denegado"
5. **Logout** → Debe cerrar sesión y redirigir a login
6. **Recarga de página** → Debe mantener sesión activa
