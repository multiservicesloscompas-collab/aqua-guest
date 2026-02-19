# Guía de Uso - Sistema de Autenticación

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

### 5. useAuthStore

Store de Zustand para gestión de autenticación.

```tsx
import { useAuthStore } from '@/store/useAuthStore';

function LoginForm() {
  const { signIn, isLoading } = useAuthStore();

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

## Ejemplo de Layout con Auth

```tsx
import { Outlet } from 'react-router-dom';
import { UserInfo } from '@/components/auth/UserInfo';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">AquaGest</h1>
          <div className="flex items-center gap-4">
            <UserInfo />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

## Protección de Rutas en App.tsx

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/components/auth/AuthProvider';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas protegidas para todos los usuarios autenticados */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          
          {/* Solo admins y empleados */}
          <Route
            path="ventas"
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <VentasPage />
              </ProtectedRoute>
            }
          />
          
          {/* Solo admins */}
          <Route
            path="config"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ConfigPage />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
```

## Manejo de Errores

```tsx
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

function LoginPage() {
  const { signIn } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      toast.success('Inicio de sesión exitoso');
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Por favor confirma tu email');
      } else {
        toast.error('Error al iniciar sesión');
      }
    }
  };

  return (
    // Tu formulario
  );
}
```

## Persistencia de Sesión

La sesión se persiste automáticamente usando Zustand persist middleware. El usuario permanecerá autenticado incluso después de recargar la página.

Para cerrar sesión manualmente:

```tsx
import { useAuthStore } from '@/store/useAuthStore';

function SomeComponent() {
  const { signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    // Usuario desconectado
  };
}
```

## Testing

Para probar diferentes roles, crea usuarios de prueba en Supabase con diferentes roles:

- **admin@aquagest.com** - Rol: admin
- **empleado@aquagest.com** - Rol: employee  
- **cliente@aquagest.com** - Rol: client

Cada uno tendrá acceso a diferentes partes de la aplicación según su rol.
