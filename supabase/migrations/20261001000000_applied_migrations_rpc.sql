-- Read-only view of the migration registry so the app can detect pending migrations on startup.
-- Rollback: DROP FUNCTION IF EXISTS public.applied_migration_versions();
CREATE OR REPLACE FUNCTION public.applied_migration_versions()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
$$;

REVOKE ALL ON FUNCTION public.applied_migration_versions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.applied_migration_versions() TO anon, authenticated;
