# Dominio: Gestión de Usuarios

## Roles
- **Admin**: Super administrador sin compañía
- **Client**: Administrador de compañía  
- **Employee**: Empleado de compañía

## Login
- Email: `usuario@ejemplo.com`
- Username: `nombreusuario` (sin @)
- Detección automática en `useAppStore.ts`

## Gestión (Menú "Más" → Usuarios)
- **Admin**: Crea clientes y gestiona empresas
- **Client**: Crea empleados de su empresa
- **Employee**: Sin acceso

## Componentes

### `UsersPage/index.tsx`
Página principal con lista y botón crear. Solo admin y client.

### `UsersPage/components/UsersList.tsx`
Cards con: nombre, email, username, rol, empresa.

### `UsersPage/components/CreateUserDialog.tsx`
Modal de creación con campos: email*, username, password*, nombre, empresa.
Validaciones: email único, username único, password ≥6 chars.

## Servicio: `UserManagementService.ts`

**Métodos principales**:
- `listUsers(currentUser, filters?)` - Lista según permisos
- `getUserById(userId)` - Obtiene usuario
- `updateUser(userId, userData)` - Actualiza usuario
- `listCompanies()` - Lista empresas (admin)
- `createCompany(companyData)` - Crea empresa (admin)
- `isUsernameAvailable(username)` - Valida unicidad
- `isEmailAvailable(email)` - Valida unicidad

## Flujo de Creación

**Admin → Cliente**:
1. Selecciona/crea empresa
2. `signUp` en auth.users
3. Perfil con `role='client'`, `company_id`, `created_by=admin.id`

**Cliente → Empleado**:
1. Empresa heredada automáticamente
2. `signUp` en auth.users  
3. Perfil con `role='employee'`, `company_id=client.companyId`, `created_by=client.id`

## Tipos

```typescript
interface UserProfile {
  id: string; email: string; username?: string; role: UserRole;
  fullName?: string; companyId?: string; company?: Company;
  createdBy?: string; createdAt: string; updatedAt: string;
}

interface Company {
  id: string; name: string; rif: string; address?: string;
  phone?: string; isActive: boolean; createdAt: string; updatedAt: string;
}
```

## Seguridad

**RLS Políticas**:
- Usuario lee su propio perfil
- Búsqueda pública de username/email para login
- Control de acceso en frontend (UserManagementService)

**Validaciones**:
- Email y username únicos
- Password ≥6 caracteres
- Admin sin empresa, Client/Employee con empresa
- Trigger `validate_user_hierarchy()` en BD

## Troubleshooting

- **"Usuario no encontrado"**: Verificar username existe y RLS permite lectura
- **"Email ya registrado"**: Email existe en auth.users
- **"Username en uso"**: Username existe en user_profiles
- **"No tienes permisos"**: Verificar rol y políticas RLS
- **Usuario no aparece**: Verificar `created_by` y filtros RLS
