# Ejemplos de Implementación

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
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

function LoginPage() {
  const { signIn } = useAppStore();

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
import { useAppStore } from '@/store/useAppStore';

function SomeComponent() {
  const { signOut } = useAppStore();

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
