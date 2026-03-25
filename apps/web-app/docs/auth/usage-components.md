# Guía de Uso - Componentes de Autenticación

## Componentes Disponibles

### 1. ProtectedRoute

Protege rutas que requieren autenticación y opcionalmente roles específicos.

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Ruta protegida para cualquier usuario autenticado
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

// Ruta para admins y empleados
<Route
  path="/ventas"
  element={
    <ProtectedRoute allowedRoles={['admin', 'employee']}>
      <VentasPage />
    </ProtectedRoute>
  }
/>
```

### 2. LogoutButton

Botón para cerrar sesión con diferentes variantes.

```tsx
import { LogoutButton } from '@/components/auth/LogoutButton';

// Botón básico
<LogoutButton />

// Botón con variante destructiva
<LogoutButton variant="destructive" />

// Solo icono
<LogoutButton showText={false} size="icon" />

// Personalizado
<LogoutButton 
  variant="outline" 
  size="sm" 
  className="ml-auto"
/>
```

### 3. UserInfo

Muestra información del usuario actual.

```tsx
import { UserInfo } from '@/components/auth/UserInfo';

// Completo
<UserInfo />

// Solo email
<UserInfo showRole={false} />

// Solo rol
<UserInfo showEmail={false} />

// Personalizado
<UserInfo className="p-4 border rounded-lg" />
```

### 4. useAuth Hook

Hook para acceder al estado de autenticación.

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  
  if (!isAuthenticated) return <div>No autenticado</div>;

  return (
    <div>
      <p>Bienvenido {user?.fullName}</p>
      <p>Rol: {user?.role}</p>
    </div>
  );
}
```

### 5. Acceso al Estado de Autenticación

El estado de autenticación está centralizado en `useAppStore`.

```tsx
import { useAppStore } from '@/store/useAppStore';

function LoginForm() {
  const { signIn, isLoading } = useAppStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // Redirigir o mostrar mensaje de éxito
    } catch (error) {
      // Manejar error
    }
  };

  return (
    // Tu formulario aquí
  );
}
```

## Verificación de Roles en Componentes

### Método 1: Usando el hook useAuth

```tsx
import { useAuth } from '@/hooks/useAuth';

function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <div>Acceso denegado</div>;
  }

  return <div>Panel de administración</div>;
}
```

### Método 2: Renderizado condicional

```tsx
import { useAuth } from '@/hooks/useAuth';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Solo para admins */}
      {user?.role === 'admin' && (
        <button>Configuración Avanzada</button>
      )}

      {/* Para admins y empleados */}
      {(user?.role === 'admin' || user?.role === 'employee') && (
        <button>Crear Venta</button>
      )}

      {/* Para todos los usuarios autenticados */}
      <button>Ver Perfil</button>
    </div>
  );
}
```

### Método 3: Función helper

```tsx
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

function MyComponent() {
  const { user } = useAuth();

  const canEdit = user && hasRole(user.role, ['admin', 'employee']);
  const canDelete = user && hasRole(user.role, ['admin']);

  return (
    <div>
      {canEdit && <button>Editar</button>}
      {canDelete && <button>Eliminar</button>}
    </div>
  );
}
```

Ver [`usage-examples.md`](./usage-examples.md) para ejemplos completos de implementación.
