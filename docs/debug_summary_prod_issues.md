# Supabase Dev→Prod Deployment Issues & Fixes

## Summary

Three critical root causes were identified through direct database inspection of both Dev and Prod projects. All were database-level misconfigurations in the Prod project that occurred during migration.

---

## Root Causes & Fixes Applied

### 1. Missing GRANT Permissions (Fixed: `fix_grant_permissions_and_default_privileges`)

**Problem**: Every table in Prod had **only `SELECT`** granted to `authenticated`, `anon`, and `service_role`. Dev had full `DELETE, INSERT, SELECT, UPDATE` for all roles. This caused **403 errors on any INSERT/UPDATE/DELETE operation** (e.g., `admin_audit_logs` INSERT).

**Root cause**: Likely `pg_dump --no-privileges` was used during migration, or the new project inherited Supabase's minimal default grants.

**Fix applied**:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON TABLE public.admin_audit_logs TO anon; -- matches existing RLS policy
```

> **Why this is safe**: RLS is enabled on all tables and controls row-level access. GRANTs are just the prerequisite "base permission" layer. Without them, RLS policies can never be evaluated.

---

### 2. Missing Default Privileges (Fixed: same migration)

**Problem**: No `ALTER DEFAULT PRIVILEGES` was set, meaning any future table migrations would also lack proper grants.

**Fix applied**:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
-- (plus sequences and routines)
```

---

### 3. Missing `on_auth_user_created` Trigger (Fixed: `create_auth_trigger_and_backfill_profiles`)

**Problem**: The trigger existed in Dev but was **completely absent in Prod**, despite the `handle_new_user` function being present. This caused **406 errors on registration profile fetch** — no profile was created for new users.

**Orphaned user confirmed**: `masterroberto636@gmail.com` (created 2026-03-17) had `profile_id: null`.

**Fix applied**:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill for existing orphaned users
INSERT INTO public.profiles (id, email)
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

---

### 4. Edge Function JWT Verification (Already Fixed)

**Problem**: Supabase's infra-level JWT verification only supports HS256 in some contexts, but Prod uses ES256. This caused **401 Invalid JWT errors** on Edge Function calls.

**Fix**: All Edge Functions were deployed with `verify_jwt: false`. Authentication is handled inside the function via `supabase.auth.getUser()` in `supabase/functions/_shared/auth.ts`, which is algorithm-agnostic.

---

## Deployment Checklist for New Supabase Projects

When creating a new Supabase project or migrating databases, **always verify**:

- [ ] GRANT permissions match Dev (query `information_schema.role_table_grants`)
- [ ] All triggers exist (query `pg_trigger` / `information_schema.triggers`)
- [ ] Default privileges are set for future tables (`ALTER DEFAULT PRIVILEGES`)
- [ ] Edge Functions are deployed with `--no-verify-jwt` flag
- [ ] Auth trigger `on_auth_user_created` exists and points to `handle_new_user`

### Verification Queries

```sql
-- Check table grants
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- Check triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Check for orphaned users (no profile)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

---

## Key Rules

1. **Never use `pg_dump --no-privileges`** when migrating between Supabase projects. If you do, re-apply all GRANT statements immediately.
2. **Edge Functions must always be deployed with `--no-verify-jwt`** on ES256 projects. Auth is handled application-side in `_shared/auth.ts`.
3. **RLS alone is not enough** — database roles need base GRANT permissions before RLS policies can even be evaluated.
4. **After any migration**, run the verification queries above to confirm parity with the source environment.
