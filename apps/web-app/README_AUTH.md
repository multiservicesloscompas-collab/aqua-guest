# Sistema de Autenticación - AquaGest

## Resumen

Se ha implementado un sistema completo de autenticación con Supabase que incluye:

- ✅ Login con email y contraseña
- ✅ Tres roles de usuario: **admin**, **employee**, **client**
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

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios
- Configuración del sistema
- Todos los reportes y estadísticas

### Employee (Empleado)
- Crear y gestionar ventas
- Gestionar alquileres
- Gestionar egresos
- Ver reportes básicos
- **NO** puede modificar configuración del sistema

### Client (Cliente)
- Ver sus propios pedidos prepagados
- Ver historial de alquileres (si aplica)
- Acceso limitado solo a lectura

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
      {user?.role === 'admin' && (
        <button>Configuración Avanzada</button>
      )}
      
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

| Email | Rol | Password |
|-------|-----|----------|
| admin@aquagest.com | admin | (tu password) |
| empleado@aquagest.com | employee | (tu password) |
| cliente@aquagest.com | client | (tu password) |

### Escenarios de Prueba

1. **Login con credenciales válidas** → Debe redirigir a dashboard
2. **Login con credenciales inválidas** → Debe mostrar error
3. **Acceso a ruta protegida sin auth** → Debe redirigir a login
4. **Acceso a ruta con rol incorrecto** → Debe mostrar "Acceso Denegado"
5. **Logout** → Debe cerrar sesión y redirigir a login
6. **Recarga de página** → Debe mantener sesión activa

## Próximos Pasos Recomendados

1. **Proteger rutas existentes** según roles apropiados
2. **Agregar RLS a tablas existentes** (sales, expenses, rentals, etc.)
3. **Implementar registro de usuarios** (si es necesario)
4. **Agregar recuperación de contraseña**
5. **Implementar cambio de contraseña**
6. **Agregar perfil de usuario editable**
7. **Logs de auditoría** para acciones importantes

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
