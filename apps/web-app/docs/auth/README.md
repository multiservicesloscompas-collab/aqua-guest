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

## Estructura de Archivos

```
apps/web-app/src/
├── types/
│   └── auth.ts                          # Tipos TypeScript para autenticación
├── store/
│   └── useAppStore.ts                   # Store Zustand centralizado (incluye auth)
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
├── docs/auth/
│   ├── README.md                        # Este archivo (overview)
│   ├── setup.md                         # Configuración de Supabase
│   ├── roles-permissions.md             # Roles y permisos detallados
│   ├── usage-components.md              # Guía de uso de componentes
│   ├── usage-examples.md                # Ejemplos de implementación
│   └── troubleshooting.md               # Solución de problemas
```

## Inicio Rápido

### 1. Configurar Base de Datos

Sigue las instrucciones en [`setup.md`](./setup.md) para configurar Supabase.

### 2. Variables de Entorno

Verifica que tu archivo `.env` tenga:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Probar el Sistema

```bash
npx nx serve web-app
```

Accede a `http://localhost:4200` y serás redirigido a `/login`.

## Documentación Detallada

- **[Configuración de Supabase](./setup.md)** - Scripts SQL y configuración de base de datos
- **[Roles y Permisos](./roles-permissions.md)** - Descripción detallada de roles y jerarquía
- **[Guía de Componentes](./usage-components.md)** - Cómo usar los componentes de autenticación
- **[Ejemplos de Uso](./usage-examples.md)** - Ejemplos prácticos de implementación
- **[Solución de Problemas](./troubleshooting.md)** - Errores comunes y soluciones

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

## Próximos Pasos

Ver [`roles-permissions.md`](./roles-permissions.md) para entender la jerarquía de usuarios y permisos recomendados.
