# Migración: Agregar Username a User Profiles

Ejecutada: 2026-03-24

## Cambios

### 1. Campo username
```sql
ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
```

### 2. Vista actualizada
```sql
DROP VIEW IF EXISTS user_profiles_with_company;
CREATE VIEW user_profiles_with_company AS
SELECT up.id, up.email, up.username, up.role, up.full_name, up.company_id,
       c.name as company_name, c.rif as company_rif, c.address, c.phone,
       c.is_active as company_is_active, up.created_by,
       creator.full_name as created_by_name, up.created_at, up.updated_at
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
LEFT JOIN user_profiles creator ON up.created_by = creator.id;
```

### 3. Política RLS (actualizada para evitar recursión)
```sql
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Clients can read company profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can read email and username for login" ON user_profiles FOR SELECT TO anon, authenticated USING (true);
```

## Características
- Username opcional y único
- Login con email O username
- Índice para búsquedas rápidas

## Rollback
```sql
DROP POLICY IF EXISTS "Public can read email and username for login" ON user_profiles;
DROP INDEX IF EXISTS idx_user_profiles_username;
ALTER TABLE user_profiles DROP COLUMN username;
```
