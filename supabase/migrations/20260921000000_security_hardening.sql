-- QR-ATT Part I: security hardening (RLS least-privilege).
-- Run in Supabase SQL editor. Safe to re-run.
-- Requires 20260919000000_admin_role_rbac.sql (is_admin helper).

-- Helper: can this user create/manage events? (teacher or admin only)
create or replace function public.is_event_creator()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  );
$$;

-- Helper: is this user a student?
create or replace function public.is_student()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student'
  );
$$;

-- EVENTS: only teachers/admins may insert (was: any authenticated user).
drop policy if exists "Users can insert events" on public.events;
drop policy if exists "Teachers and admins can insert events" on public.events;
create policy "Teachers and admins can insert events" on public.events
  for insert to authenticated
  with check (auth.uid() = created_by and public.is_event_creator());

-- EVENTS: owners may delete their own events (was: admins only, so teacher
-- delete failed at the DB even though the app allowed owner-or-admin).
drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events" on public.events
  for delete to authenticated using (auth.uid() = created_by);

-- ATTENDANCE: only students may insert their own rows (was: any role).
-- Blocks teachers/admins recording attendance via direct SQL/API calls,
-- matching the app-level guard in registerAttendance().
drop policy if exists "Students can insert their own attendance" on public.attendance;
drop policy if exists "Students can record own attendance" on public.attendance;
create policy "Students can record own attendance" on public.attendance
  for insert to authenticated
  with check (auth.uid() = student_id and public.is_student());

-- Duplicate prevention (defense in depth — also enforced by unique constraint):
-- one row per (student, event). Created in the base schema; re-assert here.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attendance_student_id_event_id_key'
  ) then
    alter table public.attendance
      add constraint attendance_student_id_event_id_key unique (student_id, event_id);
  end if;
end
$$;
