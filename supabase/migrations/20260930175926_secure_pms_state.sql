create table public.pms_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accommodations jsonb not null default '[]'::jsonb,
  reservations jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pms_state enable row level security;

create policy "Users can read their PMS state"
on public.pms_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their PMS state"
on public.pms_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their PMS state"
on public.pms_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their PMS state"
on public.pms_state for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.pms_state to authenticated;
revoke all on public.pms_state from anon;

-- These legacy tables contain guest data and must never be exposed without RLS.
alter table public.accommodations enable row level security;
alter table public.reservations enable row level security;
alter table public.settings enable row level security;
revoke all on public.accommodations from anon, authenticated;
revoke all on public.reservations from anon, authenticated;
revoke all on public.settings from anon, authenticated;
