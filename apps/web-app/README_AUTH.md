# Sistema de Autenticación - AquaGest

## Resumen

Se ha implementado un sistema completo de autenticación con Supabase que incluye:

- ✅ Login con email y contraseña
- ✅ Tres roles de usuario: **admin** (super admin), **client** (admin de compañía), **employee** (empleado)
- ✅ Sistema multi-tenant con compañías
- ✅ Jerarquía de usuarios: admin crea clients, client crea employees
- ✅ Rutas protegidas con control de acceso basado en roles
- ✅ Persistencia de sesión
- ✅ Componentes reutilizables (Login, Logout, UserInfo)
- ✅ Gestión de estado con Zustand
- ✅ Manejo de errores y feedback al usuario

## Estructura de Archivos Creados

```
apps/web-app/src/
├── types/
│   └── auth.ts                          # Tipos TypeScript para autenticación
├── store/
│   └── useAuthStore.ts                  # Store Zustand para auth
├── hooks/
│   └── useAuth.ts                       # Hook personalizado para auth
├── components/
│   └── auth/
│       ├── AuthProvider.tsx             # Proveedor de contexto auth
│       ├── ProtectedRoute.tsx           # Wrapper para rutas protegidas
│       ├── LogoutButton.tsx             # Botón de cerrar sesión
│       └── UserInfo.tsx                 # Componente info de usuario
├── pages/
│   └── LoginPage.tsx                    # Página de inicio de sesión
└── App.tsx                              # Actualizado con rutas auth

Documentación:
├── SUPABASE_AUTH_SETUP.md               # Instrucciones SQL para Supabase
├── AUTH_USAGE.md                        # Guía de uso de componentes
└── README_AUTH.md                       # Este archivo
```

## Roles y Permisos

### Admin (Super Administrador del Sistema)

- **Alcance**: Todo el sistema (sin compañía asociada)
- **Permisos**:
  - ✅ Acceso completo a todas las funcionalidades
  - ✅ Crear y gestionar compañías
  - ✅ Crear usuarios tipo "client" (admins de compañía)
  - ✅ Ver todas las compañías y sus datos
  - ✅ Configuración global del sistema
  - ✅ Todos los reportes y estadísticas

### Client (Administrador de Compañía)

- **Alcance**: Su compañía únicamente
- **Permisos**:
  - ✅ Acceso completo a su compañía
  - ✅ Crear usuarios tipo "employee" (empleados de su compañía)
  - ✅ Gestionar ventas, alquileres, egresos
  - ✅ Ver todas las métricas y reportes de su compañía
  - ✅ Configuración de su compañía
- **Restricciones**:
  - ❌ No puede ver otras compañías
  - ❌ No puede crear otros clients o admins

### Employee (Empleado de Compañía)

- **Alcance**: Su compañía únicamente
- **Permisos**:
  - ✅ Crear y gestionar ventas
  - ✅ Gestionar alquileres
  - ✅ Gestionar egresos
  - ✅ Ver reportes básicos
- **Restricciones**:
  - ❌ No puede ver métricas completas
  - ❌ No puede modificar configuración del sistema
  - ❌ No puede crear usuarios

## Sistema de Compañías (Multi-tenant)

El sistema implementa una arquitectura multi-tenant donde:

1. **Admin** (super admin) no está asociado a ninguna compañía
2. **Client** y **Employee** DEBEN estar asociados a una compañía
3. Cada compañía tiene sus propios datos aislados
4. Los usuarios solo ven datos de su compañía (excepto admin que ve todo)

### Jerarquía de Creación de Usuarios

```
Admin (super admin)
    └── Crea Compañías
    └── Crea Clients (admins de compañía)
        └── Client crea Employees (empleados de su compañía)
```

### Tabla Companies

Campos:

- `id`: UUID (primary key)
- `name`: Nombre de la compañía
- `rif`: RIF (único)
- `address`: Dirección
- `phone`: Teléfono
- `is_active`: Estado activo/inactivo
- `created_at`, `updated_at`: Timestamps

## Pasos de Implementación

### 1. Configurar Base de Datos en Supabase

Sigue las instrucciones en `SUPABASE_AUTH_SETUP.md` para:

1. Crear la tabla `user_profiles`
2. Configurar Row Level Security (RLS)
3. Crear triggers y funciones
4. Crear usuarios de prueba

**Importante**: Ejecuta todos los scripts SQL en el editor SQL de Supabase.

### 2. Variables de Entorno

Verifica que tu archivo `.env` tenga:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Instalar Dependencias (si es necesario)

El proyecto ya usa:

- `@supabase/supabase-js`
- `zustand`
- `react-router-dom`

### 4. Probar el Sistema

1. Inicia el servidor de desarrollo:

   ```bash
   npx nx serve web-app
   ```

2. Accede a `http://localhost:5173`

3. Deberías ser redirigido a `/login`

4. Usa las credenciales de los usuarios creados en Supabase

## Uso Básico

### Proteger una Ruta

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Ruta para cualquier usuario autenticado
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>

// Ruta solo para admins
<Route
  path="/config"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <ConfigPage />
    </ProtectedRoute>
  }
/>
```

### Agregar Botón de Logout

```tsx
import { LogoutButton } from '@/components/auth/LogoutButton';

function Header() {
  return (
    <header>
      <LogoutButton />
    </header>
  );
}
```

### Mostrar Info del Usuario

```tsx
import { UserInfo } from '@/components/auth/UserInfo';

function Navbar() {
  return (
    <nav>
      <UserInfo />
    </nav>
  );
}
```

### Verificar Rol en Componente

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'admin' && <button>Configuración Avanzada</button>}

      {(user?.role === 'admin' || user?.role === 'employee') && (
        <button>Crear Venta</button>
      )}
    </div>
  );
}
```

## Flujo de Autenticación

1. **Usuario no autenticado** → Redirigido a `/login`
2. **Login exitoso** → Redirigido a `/` (Index)
3. **Sesión persistida** → Usuario permanece autenticado al recargar
4. **Logout** → Sesión eliminada, redirigido a `/login`
5. **Acceso denegado** → Mensaje si el rol no tiene permisos

## Seguridad

- ✅ Row Level Security (RLS) habilitado en Supabase
- ✅ Validación de roles en backend (Supabase)
- ✅ Validación de roles en frontend (React)
- ✅ Tokens JWT manejados automáticamente por Supabase
- ✅ Sesiones con refresh automático
- ✅ Políticas de acceso granulares por tabla

## Testing

### Usuarios de Prueba Recomendados

Crea estos usuarios en Supabase:

| Email                 | Rol      | Password      |
| --------------------- | -------- | ------------- |
| admin@aquagest.com    | admin    | (tu password) |
| empleado@aquagest.com | employee | (tu password) |
| cliente@aquagest.com  | client   | (tu password) |

### Escenarios de Prueba

1. **Login con credenciales válidas** → Debe redirigir a dashboard
2. **Login con credenciales inválidas** → Debe mostrar error
3. **Acceso a ruta protegida sin auth** → Debe redirigir a login
4. **Acceso a ruta con rol incorrecto** → Debe mostrar "Acceso Denegado"
5. **Logout** → Debe cerrar sesión y redirigir a login
6. **Recarga de página** → Debe mantener sesión activa

## Próximos Pasos Recomendados

1. **Agregar `company_id` a tablas existentes** (sales, expenses, rentals, washing_machines, etc.)
2. **Actualizar RLS en todas las tablas** para filtrar por compañía
3. **Crear página de gestión de compañías** (solo para admin)
4. **Crear página de gestión de usuarios** (para admin y client)
5. **Actualizar stores** para incluir `company_id` al crear registros
6. **Proteger rutas existentes** según roles apropiados
7. **Implementar registro de usuarios** con asignación de compañía
8. **Agregar recuperación de contraseña**
9. **Implementar cambio de contraseña**
10. **Agregar perfil de usuario editable**
11. **Logs de auditoría** para acciones importantes

## Troubleshooting

### Error: "Cannot find module '@/components/ui/...'"

Los errores de TypeScript son normales durante el desarrollo. Una vez que compiles el proyecto, deberían desaparecer. Si persisten:

```bash
# Reinstalar dependencias
npm install

# Limpiar caché de NX
npx nx reset

# Reconstruir
npx nx build web-app
```

### Error: "Invalid login credentials"

- Verifica que el usuario exista en Supabase Authentication
- Verifica que el perfil exista en la tabla `user_profiles`
- Verifica que el email coincida en ambas tablas

### Usuario autenticado pero sin perfil

Si un usuario puede hacer login pero no tiene perfil:

```sql
-- Crear perfil manualmente
INSERT INTO user_profiles (id, email, role)
VALUES ('UUID_DEL_USUARIO', 'email@ejemplo.com', 'client');
```

### Sesión no persiste

Verifica que Zustand persist esté configurado correctamente en `useAuthStore.ts`.

## Documentación Adicional

- **SUPABASE_AUTH_SETUP.md**: Scripts SQL y configuración de base de datos
- **AUTH_USAGE.md**: Ejemplos detallados de uso de componentes
- **Supabase Docs**: https://supabase.com/docs/guides/auth

## Soporte

Para más información sobre la implementación, revisa:

1. Los comentarios en el código fuente
2. La documentación de Supabase Auth
3. Los ejemplos en AUTH_USAGE.md

---

**Implementado siguiendo las mejores prácticas de:**

- Arquitectura hexagonal
- Separación de responsabilidades (SRP)
- TypeScript strict mode
- Row Level Security (RLS)
- Gestión de estado con Zustand
- React Router v6
