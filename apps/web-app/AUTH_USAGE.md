# Guía de Uso - Sistema de Autenticación

> **Nota**: Esta documentación ha sido modularizada para cumplir con la regla de máximo 300 líneas por archivo.

## Documentación Completa

La documentación completa del sistema de autenticación se encuentra en:

**[`docs/auth/`](./docs/auth/)**

### Índice de Documentación

- **[README.md](./docs/auth/README.md)** - Resumen general y guía de inicio rápido
- **[setup.md](./docs/auth/setup.md)** - Configuración de tablas en Supabase
- **[setup-functions.md](./docs/auth/setup-functions.md)** - Funciones y triggers de Supabase
- **[setup-test-users.md](./docs/auth/setup-test-users.md)** - Crear usuarios de prueba
- **[roles-permissions.md](./docs/auth/roles-permissions.md)** - Roles y permisos detallados
- **[usage-components.md](./docs/auth/usage-components.md)** - Guía de uso de componentes
- **[usage-examples.md](./docs/auth/usage-examples.md)** - Ejemplos de implementación
- **[troubleshooting.md](./docs/auth/troubleshooting.md)** - Solución de problemas

## Inicio Rápido

### Componentes Principales

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserInfo } from '@/components/auth/UserInfo';
import { useAuth } from '@/hooks/useAuth';
```

### Acceso al Estado de Autenticación

El estado de autenticación está centralizado en `useAppStore`:

```tsx
import { useAppStore } from '@/store/useAppStore';

const { user, isAuthenticated, signIn, signOut } = useAppStore();
```

Para más detalles, consulta la documentación completa en [`docs/auth/`](./docs/auth/).
