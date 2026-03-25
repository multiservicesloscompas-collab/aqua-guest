# Roles y Permisos - Sistema de Autenticación

## Estructura de Roles

El sistema implementa tres roles con diferentes niveles de acceso:

- **admin**: Super administrador del sistema (sin compañía)
- **client**: Administrador de compañía (gestiona su compañía y crea empleados)
- **employee**: Empleado de compañía (acceso limitado)

## Sistema Multi-tenant

El sistema implementa una arquitectura multi-tenant donde:

1. **Admin** (super admin) no está asociado a ninguna compañía
2. **Client** y **Employee** DEBEN estar asociados a una compañía
3. Cada compañía tiene sus propios datos aislados
4. Los usuarios solo ven datos de su compañía (excepto admin que ve todo)

## Jerarquía de Creación de Usuarios

```
Admin (super admin)
    └── Crea Compañías
    └── Crea Clients (admins de compañía)
        └── Client crea Employees (empleados de su compañía)
```

## Permisos por Rol

### Admin (Super Administrador del Sistema)

**Alcance**: Todo el sistema (sin compañía asociada)

**Permisos**:
- ✅ Acceso completo a todas las funcionalidades
- ✅ Crear y gestionar compañías
- ✅ Crear usuarios tipo "client" (admins de compañía)
- ✅ Ver todas las compañías y sus datos
- ✅ Configuración global del sistema
- ✅ Todos los reportes y estadísticas

### Client (Administrador de Compañía)

**Alcance**: Su compañía únicamente

**Permisos**:
- ✅ Acceso completo a su compañía
- ✅ Crear usuarios tipo "employee" (empleados de su compañía)
- ✅ Gestionar ventas, alquileres, egresos
- ✅ Ver todas las métricas y reportes de su compañía
- ✅ Configuración de su compañía

**Restricciones**:
- ❌ No puede ver otras compañías
- ❌ No puede crear otros clients o admins

### Employee (Empleado de Compañía)

**Alcance**: Su compañía únicamente

**Permisos**:
- ✅ Crear y gestionar ventas
- ✅ Gestionar alquileres
- ✅ Gestionar egresos
- ✅ Ver reportes básicos

**Restricciones**:
- ❌ No puede ver métricas completas
- ❌ No puede modificar configuración del sistema
- ❌ No puede crear usuarios

## Tabla Companies

La tabla `companies` almacena la información de cada compañía:

**Campos**:
- `id`: UUID (primary key)
- `name`: Nombre de la compañía
- `rif`: RIF (único)
- `address`: Dirección
- `phone`: Teléfono
- `is_active`: Estado activo/inactivo
- `created_at`, `updated_at`: Timestamps

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
