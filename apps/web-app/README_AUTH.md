# Sistema de Autenticación - AquaGest

> **Nota**: Esta documentación ha sido modularizada para cumplir con la regla de máximo 300 líneas por archivo.

## Documentación Completa

La documentación completa del sistema de autenticación se encuentra en **[`docs/auth/`](./docs/auth/)**

## Resumen

Se ha implementado un sistema completo de autenticación con Supabase que incluye:

- ✅ Login con email y contraseña
- ✅ Tres roles de usuario: **admin**, **client**, **employee**
- ✅ Sistema multi-tenant con compañías
- ✅ Rutas protegidas con control de acceso basado en roles
- ✅ Persistencia de sesión
- ✅ Gestión de estado centralizada en `useAppStore`

## Índice de Documentación

- **[README.md](./docs/auth/README.md)** - Resumen general y guía de inicio rápido
- **[setup.md](./docs/auth/setup.md)** - Configuración de tablas en Supabase
- **[setup-functions.md](./docs/auth/setup-functions.md)** - Funciones y triggers
- **[setup-test-users.md](./docs/auth/setup-test-users.md)** - Crear usuarios de prueba
- **[roles-permissions.md](./docs/auth/roles-permissions.md)** - Roles y permisos detallados
- **[usage-components.md](./docs/auth/usage-components.md)** - Guía de componentes
- **[usage-examples.md](./docs/auth/usage-examples.md)** - Ejemplos de implementación
- **[troubleshooting.md](./docs/auth/troubleshooting.md)** - Solución de problemas

## Inicio Rápido

### 1. Configurar Supabase

Sigue [`docs/auth/setup.md`](./docs/auth/setup.md)

### 2. Variables de Entorno

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Ejecutar

```bash
npx nx serve web-app
```

## Uso Básico

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';

// Proteger rutas
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPage />
</ProtectedRoute>;

// Acceder al usuario
const { user, isAuthenticated } = useAuth();

// Autenticación
const { signIn, signOut } = useAppStore();
```

Para más detalles, consulta la documentación completa en [`docs/auth/`](./docs/auth/)
