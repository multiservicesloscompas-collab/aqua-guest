# Configuración de Autenticación en Supabase

> **Nota**: Esta documentación ha sido modularizada para cumplir con la regla de máximo 300 líneas por archivo.

## Documentación Completa

La documentación completa de configuración se encuentra en **[`docs/auth/`](./docs/auth/)**

### Guías de Configuración

- **[setup.md](./docs/auth/setup.md)** - Crear tablas `companies` y `user_profiles`
- **[setup-functions.md](./docs/auth/setup-functions.md)** - Funciones, triggers y vistas
- **[setup-test-users.md](./docs/auth/setup-test-users.md)** - Crear usuarios de prueba

## Estructura de Roles

- **admin**: Super administrador del sistema (sin compañía)
- **client**: Administrador de compañía (gestiona su compañía y crea empleados)
- **employee**: Empleado de compañía (acceso limitado)

## Pasos de Configuración

### 1. Crear Tablas

Sigue la guía completa en **[`docs/auth/setup.md`](./docs/auth/setup.md)** para:

- Crear tabla `companies`
- Crear tabla `user_profiles`
- Configurar Row Level Security (RLS)
- Crear políticas de acceso

### 2. Crear Funciones y Triggers

Sigue la guía en **[`docs/auth/setup-functions.md`](./docs/auth/setup-functions.md)** para:

- Función `update_updated_at_column()`
- Función `validate_user_hierarchy()`
- Vista `user_profiles_with_company`
- Trigger de auto-creación de perfil (opcional)

### 3. Crear Usuarios de Prueba

Sigue la guía en **[`docs/auth/setup-test-users.md`](./docs/auth/setup-test-users.md)** para:

- Crear super admin
- Crear compañía de prueba
- Crear admin de compañía (client)
- Crear empleado

## Variables de Entorno

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Notas Importantes

1. **Seguridad**: Nunca expongas la `service_role_key` en el frontend
2. **RLS**: Siempre habilita Row Level Security en todas las tablas sensibles
3. **Testing**: Prueba cada rol para asegurar que los permisos funcionan correctamente
4. **Email Confirmation**: Configura según tus necesidades en Authentication > Settings

Para más detalles, consulta la documentación completa en [`docs/auth/`](./docs/auth/)
