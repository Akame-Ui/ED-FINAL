-- QR-ATT Part I: Event Management fields (venue, description, status).
-- Run in Supabase SQL editor. Safe to re-run.

alter table public.events add column if not exists venue text;
alter table public.events add column if not exists description text;
alter table public.events add column if not exists status text not null default 'open';

-- Backfill any legacy NULLs, then enforce the domain.
update public.events set status = 'open' where status is null or status not in ('open', 'closed');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_status_check'
  ) then
    alter table public.events
      add constraint events_status_check check (status in ('open', 'closed'));
  end if;
end
$$;
