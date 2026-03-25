# Configuración de Google OAuth en Supabase

Esta guía te ayudará a configurar la autenticación con Google en tu proyecto de Supabase.

## 📋 Requisitos Previos

- Proyecto de Supabase activo
- Cuenta de Google Cloud Platform (GCP)

## 🔧 Paso 1: Configurar Google Cloud Console

### 1.1 Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el nombre del proyecto

### 1.2 Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google+ API"
3. Haz clic en **Enable**

### 1.3 Configurar OAuth Consent Screen

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** como tipo de usuario
3. Completa la información requerida:
   - **App name**: AquaGest
   - **User support email**: tu email
   - **Developer contact information**: tu email
4. Haz clic en **Save and Continue**
5. En **Scopes**, agrega los scopes básicos:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Haz clic en **Save and Continue**
7. En **Test users** (opcional), agrega emails de prueba
8. Haz clic en **Save and Continue**

### 1.4 Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Selecciona **Web application**
4. Configura:
   - **Name**: AquaGest Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:4200` (desarrollo)
     - Tu URL de producción (ej: `https://tu-app.vercel.app`)
   - **Authorized redirect URIs**:
     - `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`
     - Para desarrollo local también puedes agregar: `http://localhost:54321/auth/v1/callback`
5. Haz clic en **Create**
6. **Guarda el Client ID y Client Secret** que se muestran

## 🔐 Paso 2: Configurar Supabase

### 2.1 Agregar Google como Provider

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. En el menú lateral, ve a **Authentication** > **Providers**
3. Busca **Google** en la lista
4. Habilita el toggle de Google
5. Ingresa:
   - **Client ID**: El Client ID de Google Cloud Console
   - **Client Secret**: El Client Secret de Google Cloud Console
6. Haz clic en **Save**

### 2.2 Configurar Redirect URLs

1. En **Authentication** > **URL Configuration**
2. Agrega tus URLs de redirección:
   - **Site URL**: `http://localhost:4200` (desarrollo) o tu URL de producción
   - **Redirect URLs**: 
     - `http://localhost:4200`
     - Tu URL de producción

## 🔄 Paso 3: Crear Perfil de Usuario Automáticamente

Cuando un usuario inicia sesión con Google por primera vez, necesitas crear su perfil en la tabla `user_profiles`.

### Opción 1: Trigger Automático (Recomendado)

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Función para crear perfil automáticamente al registrarse con OAuth
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear perfil si no existe
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (
      id,
      email,
      role,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'client', -- Rol por defecto para usuarios OAuth
      NEW.raw_user_meta_data->>'full_name',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created_oauth ON auth.users;
CREATE TRIGGER on_auth_user_created_oauth
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_app_meta_data->>'provider' = 'google')
  EXECUTE FUNCTION public.handle_new_oauth_user();
```

### Opción 2: Crear Perfil Manualmente

Si prefieres crear perfiles manualmente, puedes hacerlo desde el código después del login.

## ✅ Paso 4: Probar la Configuración

1. Inicia tu aplicación en desarrollo: `npx nx serve web-app`
2. Ve a la página de login
3. Haz clic en el botón "Continuar con Google"
4. Deberías ser redirigido a Google para autenticarte
5. Después de autenticarte, deberías regresar a tu aplicación con la sesión iniciada

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

- Verifica que la URL de redirección en Google Cloud Console coincida exactamente con la de Supabase
- Formato correcto: `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`

### Error: "Access blocked: This app's request is invalid"

- Asegúrate de haber configurado el OAuth Consent Screen
- Verifica que los scopes estén correctamente configurados

### El usuario se autentica pero no tiene perfil

- Verifica que el trigger `handle_new_oauth_user` esté creado
- Revisa los logs de Supabase para ver si hay errores
- Verifica que la tabla `user_profiles` tenga los permisos correctos

### No redirige después del login

- Verifica la configuración de `redirectTo` en el código
- Asegúrate de que la URL esté en la lista de Redirect URLs permitidas en Supabase

## 📝 Notas Importantes

1. **Seguridad**: Nunca expongas el Client Secret en el frontend
2. **Producción**: Actualiza las URLs cuando despliegues a producción
3. **Testing**: Usa el modo "Testing" en Google Cloud Console durante el desarrollo
4. **Publicación**: Para publicar tu app, necesitarás verificarla en Google Cloud Console

## 🔗 Referencias

- [Supabase Auth - Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
