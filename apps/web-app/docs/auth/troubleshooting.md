# Solución de Problemas

## Error: "Cannot find module '@/components/ui/...'"

Los errores de TypeScript son normales durante el desarrollo. Una vez que compiles el proyecto, deberían desaparecer. Si persisten:

```bash
# Reinstalar dependencias
npm install

# Limpiar caché de NX
npx nx reset

# Reconstruir
npx nx build web-app
```

## Error: "Invalid login credentials"

- Verifica que el usuario exista en Supabase Authentication
- Verifica que el perfil exista en la tabla `user_profiles`
- Verifica que el email coincida en ambas tablas

## Usuario autenticado pero sin perfil

Si un usuario puede hacer login pero no tiene perfil:

```sql
-- Crear perfil manualmente
INSERT INTO user_profiles (id, email, role)
VALUES ('UUID_DEL_USUARIO', 'email@ejemplo.com', 'client');
```

## Sesión no persiste

Verifica que Zustand persist esté configurado correctamente en `useAppStore.ts`.

## Error de permisos RLS

Si recibes errores de permisos al consultar datos:

1. Verifica que las políticas RLS estén correctamente configuradas
2. Asegúrate de que el usuario tenga el rol correcto en `user_profiles`
3. Revisa que `company_id` esté correctamente asignado para roles `client` y `employee`

## Usuario no puede crear empleados

Si un usuario con rol `client` no puede crear empleados:

1. Verifica que el `client` tenga un `company_id` asignado
2. Asegúrate de que la compañía esté activa (`is_active = true`)
3. Revisa las políticas RLS en la tabla `user_profiles`

## Documentación Adicional

- **[Configuración de Supabase](./setup.md)** - Scripts SQL y configuración
- **[Guía de Componentes](./usage-components.md)** - Uso de componentes
- **Supabase Docs**: https://supabase.com/docs/guides/auth
