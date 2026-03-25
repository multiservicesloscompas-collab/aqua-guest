# Edge Function: Create User (Opcional)

**Estado actual**: Creación desde frontend con `supabase.auth.signUp()` funciona correctamente.

**Mejora futura**: Edge Function con `service_role_key` para mayor seguridad.

## Endpoint
```
POST /functions/v1/create-user
Authorization: Bearer {user_access_token}
```

## Request/Response
```typescript
// Request
{ email: string; username?: string; password: string; fullName?: string;
  role: 'client' | 'employee'; companyId?: string; companyData?: {...} }

// Success
{ success: true; user: { id, email, username, role, companyId } }

// Error
{ success: false; error: string }
```

## Código Simplificado

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    const body = await req.json()
    
    // 1. Verificar usuario actual y permisos
    // 2. Crear empresa si es necesario (admin)
    // 3. Crear usuario con admin.createUser()
    // 4. Crear perfil en user_profiles
    // 5. Rollback si falla
    
    return new Response(JSON.stringify({ success: true, user: {...} }))
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 })
  }
})
```

## Deployment
```bash
supabase functions deploy create-user --no-verify-jwt
```

## Ventajas
- `service_role_key` nunca expuesto al frontend
- Validaciones server-side robustas
- Rollback automático
- Email auto-confirmado

**Nota**: Implementación actual con `signUp` desde frontend funciona correctamente. Esta Edge Function es mejora futura opcional.
