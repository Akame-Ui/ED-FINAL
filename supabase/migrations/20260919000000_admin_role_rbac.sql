-- QR-ATT Part I: Administrator role + RBAC hardening.
-- Run this in Supabase SQL editor (or `supabase db push`).
-- Safe to re-run.

-- 1) Allow 'admin' role -------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

-- 2) Trigger: accept admin from metadata, never downgrade an admin ------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_role text;
  meta_name text;
begin
  meta_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'student');
  if meta_role not in ('student', 'teacher', 'admin') then
    meta_role := 'student';
  end if;
  meta_name := nullif(coalesce(new.raw_user_meta_data->>'full_name', ''), '');

  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), meta_name, meta_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    -- never silently downgrade an existing admin/teacher to student
    role = case
      when public.profiles.role = 'admin' then 'admin'
      when excluded.role <> 'student' then excluded.role
      else public.profiles.role
    end,
    updated_at = now();
  return new;
end;
$$;

-- 3) Helper: is the caller an admin? (used by RLS policies) -------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- 4) Admin RLS policies --------------------------------------------------------
-- Admins can read every profile (user management).
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

-- Admins can change roles / names (user management).
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins can read all events (event management + reports).
drop policy if exists "Admins can view all events" on public.events;
create policy "Admins can view all events" on public.events
  for select to authenticated using (public.is_admin());

-- Admins can update / delete any event (manage + correct).
drop policy if exists "Admins can update all events" on public.events;
create policy "Admins can update all events" on public.events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete all events" on public.events;
create policy "Admins can delete all events" on public.events
  for delete to authenticated using (public.is_admin());

-- Admins can view all attendance (overall attendance + reports).
drop policy if exists "Admins can view all attendance" on public.attendance;
create policy "Admins can view all attendance" on public.attendance
  for select to authenticated using (public.is_admin());

-- Admins can delete attendance rows (manage/correct records).
drop policy if exists "Admins can delete attendance" on public.attendance;
create policy "Admins can delete attendance" on public.attendance
  for delete to authenticated using (public.is_admin());

-- 5) Seed helper (run manually, replace email): promote a user to admin ------
-- update public.profiles set role = 'admin' where email = 'admin@school.edu';
