# Migraciones de la base de datos

Todo cambio de esquema es un archivo SQL en `supabase/migrations/`. Supabase guarda en cada base
(local y producción) qué archivos ya se aplicaron, en la tabla `supabase_migrations.schema_migrations`.
Ese registro es lo que dice qué migración está aplicada y cuál no.

|               | Local                                 | Producción                                         |
| :------------ | :------------------------------------ | :------------------------------------------------- |
| Credenciales  | **Ninguna** (Docker en tu máquina)    | **Sí**: cuenta de Supabase y contraseña de la base |
| Quién aplica  | `npm run local` (automático)          | Tú, con `npm run db:migrate`                       |
| Ver qué falta | `npx supabase migration list --local` | `npm run db:migrations:status`                     |

## Cómo te enteras de que falta una migración

Al entrar al Dashboard, la app compara las migraciones que trae el código (las de `supabase/migrations`
al construir la app) con las que tiene la base. Si faltan, aparece un aviso amarillo de 15 segundos:
«Base de datos desactualizada. Falta 1 migración. Ejecuta npm run db:migrate para aplicarla.».
Sale una vez por sesión y no bloquea nada. La app **solo avisa**: no puede aplicar migraciones, porque
para eso necesitaría la contraseña de la base dentro del navegador.

## Local (sin credenciales)

Requisitos: Docker corriendo y `npm install` hecho.

### Usar la base local

1. `npm run local`
   - Levanta Supabase en Docker, **aplica las migraciones pendientes** (`supabase migration up`) y abre la app.
   - No borra datos. Si una migración falla, se detiene y te muestra el error.
2. Para ver el estado: `npx supabase migration list --local`. La columna `Remote` es la base local.

### Crear una migración nueva

1. `npx supabase migration new nombre_corto_del_cambio`
   - Crea `supabase/migrations/<fecha-hora>_nombre_corto_del_cambio.sql` con la fecha y hora actuales.
2. Escribe el SQL. Reglas del proyecto:
   - Primero cambios **aditivos** (columnas o tablas nuevas con valor por defecto).
   - Pon el **SQL de reversión como comentario** al inicio del archivo (mira `20261001000000_applied_migrations_rpc.sql`).
   - No uses `FOR ALL TO public USING (true)` en tablas nuevas sin decidirlo.
3. `npm run local` (o `npx supabase migration up`) para aplicarla en local y probarla.
4. Commitea el archivo junto con el código que lo necesita.

### Empezar de cero

`npm run supabase:reset` **borra la base local** y vuelve a aplicar todas las migraciones y `seed.sql`.
Úsalo solo si quieres perder los datos locales.

## Producción (con credenciales)

### Una sola vez: conectar tu computadora

1. Inicia sesión: `npx supabase login` (abre el navegador y guarda un token en tu computadora).
2. Conecta el proyecto: `npx supabase link --project-ref <ref>`
   - `<ref>` está en el panel de Supabase, en _Project Settings → General → Reference ID_.
   - Te pide la **contraseña de la base de datos** (la que definiste al crear el proyecto; si no la
     recuerdas, restablécela en _Project Settings → Database_). También puedes darla con la variable
     `SUPABASE_DB_PASSWORD`. Nunca la subas al repositorio.
3. Marca como aplicadas las dos migraciones que producción ya tiene (se hicieron a mano antes de que
   existiera el registro):

   ```bash
   npx supabase migration repair --status applied 20260101000000 20260717120000
   ```

   **No te saltes este paso:** `20260101000000` es la base de la base _local_ y no debe ejecutarse en
   producción (el esquema real es distinto y fallaría o cambiaría políticas de seguridad).

4. Comprueba que producción tenga las columnas `amount_out_usd`, `amount_in_usd` y `difference_usd`
   en `payment_balance_transactions` (si no las tiene, la segunda migración habría que aplicarla de verdad).
5. `npm run db:migrations:status` debe mostrar las dos primeras con valor en `Local` y en `Remote`.

### Cada vez que hay una migración nueva

1. **Antes de desplegar el código** que la necesita (así la app desplegada no avisa de migración pendiente):
2. Mira qué se aplicaría, sin cambiar nada: `npx supabase db push --dry-run`
3. Aplícala: `npm run db:migrate`
   - Te lista las migraciones pendientes y pide confirmación. Aplica solo las que faltan y las registra.
4. Verifica: `npm run db:migrations:status` (todas con valor en `Local` y `Remote`).
5. Ahora sí, haz el merge a `main` para que Vercel despliegue.

La primera vez que se despliegue este sistema, `20261001000000_applied_migrations_rpc.sql` es la
pendiente: crea la función de solo lectura que la app usa para verificar. Hasta aplicarla, producción
mostrará el aviso de 1 migración pendiente.

### Si una migración sale mal

1. Ejecuta el SQL de reversión que está en los comentarios del archivo (en el _SQL Editor_ de Supabase).
2. Quita la marca del registro: `npx supabase migration repair --status reverted <version>`

## Qué se versiona

`supabase/config.toml`, `supabase/migrations/` y `supabase/seed.sql` van en git. Lo que genera el CLI
(`supabase/.temp`, `supabase/.branches`) y los `.env` están ignorados; ahí queda, por ejemplo, la
referencia del proyecto enlazado.
