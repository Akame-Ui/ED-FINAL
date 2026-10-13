# QR-ATT Security Model (Part I)

How each required control is implemented, and where to point the instructor.

## 1. Authentication (`src/lib/auth.ts`, `src/lib/supabase.ts`)
- Supabase Auth with email + password. Passwords are hashed server-side; the
  app never stores them. `signUp` / `signInWithPassword` only.
- Session persistence: `createClient(..., { auth: { persistSession: true,
  autoRefreshToken: true, detectSessionInUrl: false } })` — tokens refresh
  automatically, survive restarts, and are never hand-rolled.
- Boot restore: `src/app/_layout.tsx` calls `getSession()` then subscribes to
  `onAuthStateChange`, so revoked/expired sessions drop the user to login.

## 2. Role-based authorization (two layers)
- App layer: `useRole()` + `canCreateEvents()` / `canManageAll()`; Teacher tab
  hidden unless teacher/admin, Admin tab hidden unless admin; `updateEvent` /
  `deleteEvent` check owner-or-admin; `updateProfile` role changes are
  admin-only; `registerAttendance` requires the `student` role.
- Database layer (cannot be bypassed via SQL/API): `is_admin()`,
  `is_event_creator()`, `is_student()` helpers + policies in
  `supabase/migrations/20260919000000_admin_role_rbac.sql` and
  `.../20260921000000_security_hardening.sql`.

## 3. Database access protection (RLS)
All tables have RLS enabled. Key policies:
- `profiles`: owner read/insert/update; teachers read attendees of their
  events; admins read/update all.
- `events`: authenticated read; **insert restricted to teacher/admin**
  (`auth.uid() = created_by AND is_event_creator()`); owners update/delete
  own; admins update/delete all.
- `attendance`: students read own; teachers read their events' rows; admins
  read/delete all; **insert restricted to students recording their own row**
  (`auth.uid() = student_id AND is_student()`).
- Run order: base `schema.sql` → `20260919000000` → `20260920000000`
  (venue/description/status) → `20260921000000`.

## 4. Input validation (`src/lib/validation.ts`)
Centralized `validateEmail / validatePassword / validateRequired /
validateEventCode / sanitize` wired into login, register, and event creation.
Server side mirrors it: event-code shape, `events_status_check`,
`events_time_order`, and `profiles_role_check` constraints.

## 5. Duplicate attendance prevention
Unique constraint `(student_id, event_id)` + `registerAttendance` maps Postgres
`23505` to "Already registered for this event." (no double rows, friendly UX).

## 6. Secure session handling
No tokens in app code. Expiry/refresh handled by GoTrue; `onAuthStateChange`
propagates revocation instantly; deep-link code exchange uses
`exchangeCodeForSession` once (single-use `code`).

## 7. Proper logout (`signOut()`)
Revokes the server session (`await supabase.auth.signOut()`), surfaces server
errors, and clears local auth state in `finally` so no stale session survives.
Profile screen then `router.replace('/login')`.

## 8. Protected database operations
Every privileged lib call pre-checks (`requireAdmin`, `checkCanManage`,
student-only insert) **and** the matching RLS policy enforces it — removing
the app check alone still blocks abuse at the database.
